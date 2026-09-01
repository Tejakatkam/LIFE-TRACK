const PDFDocument = require("pdfkit");
const db = require("../config/db");

exports.generateWeeklyPDF = async (userId, trackData = {}, allHabits = []) => {
  // 1. Date Calculations (Monday to Sunday)
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const fmtDate = (d) => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${yr}-${mo}-${da}`;
  };

  const weekStartStr = fmtDate(weekStart);
  const weekEndStr = fmtDate(weekEnd);

  const weekDaysStr = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    weekDaysStr.push(fmtDate(d));
  }
  const todayStr = fmtDate(now);

  // Fetch DB Data
  const [userRows] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
  const user = (userRows && userRows[0]) || {};
  const memberName = user.username || "Katkam Teja";

  const [food] = await db.query(
    "SELECT log_date, SUM(calories) as total_calories FROM food_logs WHERE user_id = ? AND log_date >= ? AND log_date <= ? GROUP BY log_date",
    [userId, weekStartStr, weekEndStr]
  ).catch(() => [[]]);

  const foodMap = {};
  let totalCals = 0;
  let foodDaysCount = 0;
  (food || []).forEach(f => {
    const dStr = f.log_date instanceof Date ? fmtDate(f.log_date) : String(f.log_date).slice(0, 10);
    const cals = Number(f.total_calories);
    foodMap[dStr] = cals;
    totalCals += cals;
    foodDaysCount++;
  });
  const avgCals = foodDaysCount > 0 ? Math.round(totalCals / foodDaysCount) : 0;

  // Default Standard Habits exactly matching reference
  const defaultHabitList = [
    { id: "skincare", name: "Skincare", sub: "Morning &\nnight\nroutine", iconType: "star" },
    { id: "diet", name: "Proper\nDiet", sub: "Balanced\nmeals\ntoday", iconType: "diamond" },
    { id: "steps", name: "Walking\nSteps", sub: "Daily step\ngoal", iconType: "target" },
    { id: "water", name: "Water\nIntake", sub: "Stay\nhydrated", iconType: "water" },
    { id: "sleep", name: "Quality\nSleep", sub: "Restful\nsleep", iconType: "moon" }
  ];

  const sourceHabits = allHabits.length > 0 ? allHabits.map((h, i) => {
    const def = defaultHabitList[i % defaultHabitList.length];
    return {
      id: h.id,
      name: h.name.includes("\n") ? h.name : (h.name.length > 10 ? h.name.replace(" ", "\n") : h.name),
      sub: h.sub || def.sub,
      iconType: def.iconType
    };
  }) : defaultHabitList;

  // Process Habit Stats
  let totalChecks = 0;
  let totalPossible = 0;
  const isFuture = (dStr) => dStr > todayStr;

  const habitsWithStats = sourceHabits.map(h => {
    let streak = 0;
    let maxStreak = 0;
    let completedThisWeek = 0;
    let possibleThisWeek = 0;

    const days = weekDaysStr.map(dStr => {
      const future = isFuture(dStr);
      const done = !!trackData[`${dStr}_${h.id}`];

      if (!future) {
        possibleThisWeek++;
        if (done) {
          completedThisWeek++;
          streak++;
          if (streak > maxStreak) maxStreak = streak;
        } else {
          streak = 0;
        }
      }
      return { date: dStr, done, future };
    });

    const rate = possibleThisWeek > 0 ? Math.round((completedThisWeek / possibleThisWeek) * 100) : 0;
    totalChecks += completedThisWeek;
    totalPossible += possibleThisWeek;

    return { ...h, days, rate, maxStreak };
  });

  const overallHabitRate = totalPossible > 0 ? Math.round((totalChecks / totalPossible) * 100) : 0;
  const bestOverallStreak = habitsWithStats.reduce((max, h) => Math.max(max, h.maxStreak), 0);

  // Health Metrics Calculation
  const weightVal = user.weight ? Number(user.weight) : 104;
  const heightVal = user.height ? Number(user.height) : 180;
  const ageVal = user.age ? Number(user.age) : 25;
  const genderVal = user.gender || "male";

  const heightM = heightVal / 100;
  const bmiVal = (weightVal / (heightM * heightM)).toFixed(1);
  let bmiLabel = "Normal";
  if (bmiVal < 18.5) bmiLabel = "Underweight";
  else if (bmiVal < 25) bmiLabel = "Normal";
  else if (bmiVal < 30) bmiLabel = "Overweight";
  else bmiLabel = "Obese";

  let bmrVal = Math.round(10 * weightVal + 6.25 * heightVal - 5 * ageVal + (genderVal === "male" ? 5 : -161));
  let tdeeVal = Math.round(bmrVal * 1.2);

  // PDF Document Setup
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const buffers = [];
  doc.on("data", buffers.push.bind(buffers));

  // Helper Vector Drawing Functions (Guarantee 100% Vector Quality & Zero Font Encoding Bugs)
  const drawVectorIcon = (type, cx, cy) => {
    doc.save();
    if (type === "star") {
      // 4-pointed sparkle star
      doc.fillColor("#c5a073");
      const r = 5.5;
      doc.moveTo(cx, cy - r)
        .lineTo(cx + 1.6, cy - 1.6)
        .lineTo(cx + r, cy)
        .lineTo(cx + 1.6, cy + 1.6)
        .lineTo(cx, cy + r)
        .lineTo(cx - 1.6, cy + 1.6)
        .lineTo(cx - r, cy)
        .lineTo(cx - 1.6, cy - 1.6)
        .closePath()
        .fill();
    } else if (type === "diamond") {
      // Double diamond
      doc.lineWidth(1).strokeColor("#66584d");
      doc.moveTo(cx, cy - 5.5).lineTo(cx + 5.5, cy).lineTo(cx, cy + 5.5).lineTo(cx - 5.5, cy).closePath().stroke();
      doc.fillColor("#c5a073");
      doc.moveTo(cx, cy - 2.5).lineTo(cx + 2.5, cy).lineTo(cx, cy + 2.5).lineTo(cx - 2.5, cy).closePath().fill();
    } else if (type === "target") {
      // Circle inside circle
      doc.lineWidth(1).strokeColor("#66584d");
      doc.circle(cx, cy, 5.5).stroke();
      doc.fillColor("#c5a073").circle(cx, cy, 2.5).fill();
    } else if (type === "water") {
      // Diamond water icon
      doc.lineWidth(1).strokeColor("#66584d");
      doc.moveTo(cx, cy - 5.5).lineTo(cx + 5.5, cy).lineTo(cx, cy + 5.5).lineTo(cx - 5.5, cy).closePath().stroke();
    } else if (type === "moon") {
      // Half-moon / split circle
      doc.lineWidth(1).strokeColor("#66584d");
      doc.circle(cx, cy, 5.5).stroke();
      doc.fillColor("#66584d");
      doc.moveTo(cx, cy - 5.5).lineTo(cx, cy + 5.5).arc(cx, cy, 5.5, Math.PI / 2, -Math.PI / 2, true).closePath().fill();
    }
    doc.restore();
  };

  const drawCheckmark = (x, y, w, h) => {
    doc.save();
    doc.lineWidth(1.3).strokeColor("#488248");
    const cx = x + w / 2;
    const cy = y + h / 2;
    doc.moveTo(cx - 4, cy).lineTo(cx - 1.2, cy + 3.2).lineTo(cx + 4.2, cy - 3.2).stroke();
    doc.restore();
  };

  const drawCross = (x, y, w, h) => {
    doc.save();
    doc.lineWidth(1.2).strokeColor("#b85d5d");
    const cx = x + w / 2;
    const cy = y + h / 2;
    doc.moveTo(cx - 3.2, cy - 3.2).lineTo(cx + 3.2, cy + 3.2).stroke();
    doc.moveTo(cx + 3.2, cy - 3.2).lineTo(cx - 3.2, cy + 3.2).stroke();
    doc.restore();
  };

  const drawDash = (x, y, w, h) => {
    doc.save();
    doc.lineWidth(1.2).strokeColor("#b0a89f");
    const cx = x + w / 2;
    const cy = y + h / 2;
    doc.moveTo(cx - 3, cy).lineTo(cx + 3, cy).stroke();
    doc.restore();
  };

  const drawFlame = (cx, cy) => {
    doc.save();
    doc.fillColor("#e07a3c");
    doc.moveTo(cx, cy - 5)
      .bezierCurveTo(cx + 3.5, cy - 1, cx + 4, cy + 3, cx, cy + 5)
      .bezierCurveTo(cx - 4, cy + 3, cx - 3.5, cy - 1, cx, cy - 5)
      .fill();
    doc.fillColor("#ffd699");
    doc.circle(cx, cy + 2.5, 1.3).fill();
    doc.restore();
  };

  return new Promise((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    // =========================================================================
    // PAGE 1: Header Banner + Week at a Glance + Habit Tracker (First 3 Habits)
    // =========================================================================

    // Top Dark Banner
    doc.rect(0, 0, doc.page.width, 200).fill("#1c1815");

    // Brand Name
    doc.font("Times-Roman").fontSize(13).fillColor("#dfd7cb").text("life·track", 42, 34);

    // Pill Badge: WEEKLY REPORT
    doc.roundedRect(doc.page.width - 152, 30, 110, 22, 11).lineWidth(0.8).stroke("#4d3f35");
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#c5a073").text("WEEKLY REPORT", doc.page.width - 152, 37, { width: 110, align: "center", characterSpacing: 1.2 });

    // Decorative Arc
    doc.save();
    doc.lineWidth(0.8).strokeColor("#2f2722");
    doc.moveTo(doc.page.width * 0.45, 0).bezierCurveTo(doc.page.width * 0.55, 110, doc.page.width * 0.8, 175, doc.page.width, 175).stroke();
    doc.restore();

    // Main Title: Wellness Report
    doc.font("Times-Roman").fontSize(34).fillColor("#f7f4ed").text("Wellness", 42, 78);
    doc.font("Times-Italic").fontSize(34).fillColor("#c8a27a").text("Report", 42, 116);
    doc.font("Helvetica").fontSize(7.5).fillColor("#8a7e72").text("PERSONAL HEALTH & HABIT SUMMARY", 42, 158, { characterSpacing: 1.4 });

    // 3-Column Metadata Bar
    const metaY = 176;
    doc.font("Helvetica-Bold").fontSize(6).fillColor("#8a7e72").text("MEMBER", 42, metaY, { characterSpacing: 1.2 });
    doc.font("Times-Roman").fontSize(10).fillColor("#f7f4ed").text(memberName, 42, metaY + 8);

    const periodFormatted = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    doc.font("Helvetica-Bold").fontSize(6).fillColor("#8a7e72").text("PERIOD", 155, metaY, { characterSpacing: 1.2 });
    doc.font("Times-Roman").fontSize(10).fillColor("#f7f4ed").text(periodFormatted, 155, metaY + 8);

    const generatedFormatted = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    doc.font("Helvetica-Bold").fontSize(6).fillColor("#8a7e72").text("GENERATED", 268, metaY, { characterSpacing: 1.2 });
    doc.font("Times-Roman").fontSize(10).fillColor("#f7f4ed").text(generatedFormatted, 268, metaY + 8);

    let curY = 230;

    // SECTION 1: OVERVIEW / Week at a Glance
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#8a7e72").text("OVERVIEW", 42, curY, { characterSpacing: 1.8 });
    curY += 12;
    doc.font("Times-Roman").fontSize(19).fillColor("#1c1815").text("Week at a Glance", 42, curY);
    curY += 26;

    // 4-Column Stat Box (Exact Spacing & Proportion)
    const boxW = doc.page.width - 84;
    const boxH = 66;
    doc.roundedRect(42, curY, boxW, boxH, 6).lineWidth(0.6).stroke("#e5e0d8");

    const statColW = boxW / 4;

    // Col 1: Habit Completion
    doc.font("Times-Roman").fontSize(20).fillColor("#1c1815").text(`${overallHabitRate}`, 42, curY + 14, { width: statColW - 12, align: "center", continued: true });
    doc.font("Times-Roman").fontSize(11).text(" %");
    doc.font("Helvetica-Bold").fontSize(6.5).fillColor("#8a7e72").text("HABIT COMPLETION", 42, curY + 42, { width: statColW, align: "center", characterSpacing: 0.8 });

    // Col 2: Best Streak
    doc.font("Times-Roman").fontSize(20).fillColor("#1c1815").text(`${bestOverallStreak}`, 42 + statColW, curY + 14, { width: statColW, align: "center" });
    doc.font("Helvetica-Bold").fontSize(6.5).fillColor("#8a7e72").text("BEST STREAK", 42 + statColW, curY + 42, { width: statColW, align: "center", characterSpacing: 0.8 });

    // Col 3: Avg Daily Intake
    doc.font("Times-Roman").fontSize(20).fillColor("#1c1815").text(`${avgCals}`, 42 + statColW * 2, curY + 14, { width: statColW - 16, align: "center", continued: true });
    doc.font("Times-Roman").fontSize(11).text(" kcal");
    doc.font("Helvetica-Bold").fontSize(6.5).fillColor("#8a7e72").text("AVG DAILY INTAKE", 42 + statColW * 2, curY + 42, { width: statColW, align: "center", characterSpacing: 0.8 });

    // Col 4: Total Steps
    doc.font("Times-Roman").fontSize(20).fillColor("#1c1815").text("0", 42 + statColW * 3, curY + 14, { width: statColW - 16, align: "center", continued: true });
    doc.font("Times-Roman").fontSize(11).text(" steps");
    doc.font("Helvetica-Bold").fontSize(6.5).fillColor("#8a7e72").text("TOTAL STEPS", 42 + statColW * 3, curY + 42, { width: statColW, align: "center", characterSpacing: 0.8 });

    curY += boxH + 28;

    // Divider
    doc.moveTo(42, curY).lineTo(doc.page.width - 42, curY).lineWidth(0.5).stroke("#e5e0d8");
    curY += 20;

    // SECTION 2: DAILY HABITS / Habit Tracker (Part 1)
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#8a7e72").text("DAILY HABITS", 42, curY, { characterSpacing: 1.8 });
    curY += 12;
    doc.font("Times-Roman").fontSize(19).fillColor("#1c1815").text("Habit Tracker", 42, curY);
    curY += 26;

    // Table Header
    const renderTableHeader = (yPos) => {
      doc.font("Helvetica-Bold").fontSize(6.5).fillColor("#8a7e72");
      doc.text("HABIT", 42, yPos, { characterSpacing: 1 });
      let dayX = 172;
      ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].forEach(d => {
        doc.text(d, dayX, yPos, { width: 32, align: "center", characterSpacing: 0.6 });
        dayX += 36;
      });
      doc.text("RATE", dayX + 8, yPos, { characterSpacing: 1 });
      doc.text("STREAK", dayX + 48, yPos, { characterSpacing: 1 });

      yPos += 12;
      doc.moveTo(42, yPos).lineTo(doc.page.width - 42, yPos).lineWidth(0.5).stroke("#e5e0d8");
      return yPos + 14;
    };

    curY = renderTableHeader(curY);

    // Habit Row Renderer
    const renderHabitRow = (h, yPos) => {
      // Icon Box
      doc.roundedRect(42, yPos + 2, 22, 22, 5).lineWidth(0.6).stroke("#e0dacf");
      drawVectorIcon(h.iconType, 42 + 11, yPos + 13);

      // Name & Subtitle
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#1c1815").text(h.name, 72, yPos + 1, { width: 90, lineGap: 1 });
      doc.font("Helvetica").fontSize(7).fillColor("#8a7e72").text(h.sub, 72, yPos + 24, { width: 90, lineGap: 1 });

      // 7 Day Status Badges
      let dayX = 172;
      h.days.forEach(d => {
        const bw = 24;
        const bh = 22;
        if (d.future) {
          doc.roundedRect(dayX + 4, yPos + 6, bw, bh, 4).fillAndStroke("#f8f7f5", "#ede8e1");
          drawDash(dayX + 4, yPos + 6, bw, bh);
        } else if (d.done) {
          doc.roundedRect(dayX + 4, yPos + 6, bw, bh, 4).fillAndStroke("#edf6ed", "#d5ebd5");
          drawCheckmark(dayX + 4, yPos + 6, bw, bh);
        } else {
          doc.roundedRect(dayX + 4, yPos + 6, bw, bh, 4).fillAndStroke("#fcf0f0", "#f5d5d5");
          drawCross(dayX + 4, yPos + 6, bw, bh);
        }
        dayX += 36;
      });

      // Rate
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#1c1815").text(`${h.rate}%`, dayX + 10, yPos + 11);

      // Streak (Flame + Count)
      drawFlame(dayX + 54, yPos + 8);
      doc.font("Helvetica").fontSize(8).fillColor("#8a7e72").text(`${h.maxStreak}`, dayX + 47, yPos + 16, { width: 14, align: "center" });

      yPos += 54;
      doc.moveTo(42, yPos).lineTo(doc.page.width - 42, yPos).lineWidth(0.5).stroke("#f0ece5");
      return yPos + 14;
    };

    // Render First 3 Habits on Page 1
    const p1Habits = habitsWithStats.slice(0, 3);
    p1Habits.forEach(h => {
      curY = renderHabitRow(h, curY);
    });

    // =========================================================================
    // PAGE 2: Remaining Habits + Calorie Summary + Health Indicators
    // =========================================================================
    doc.addPage();
    curY = 40;

    curY = renderTableHeader(curY);

    const p2Habits = habitsWithStats.slice(3);
    p2Habits.forEach(h => {
      curY = renderHabitRow(h, curY);
    });

    curY += 10;

    // SECTION 3: NUTRITION / Calorie Summary
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#8a7e72").text("NUTRITION", 42, curY, { characterSpacing: 1.8 });
    curY += 12;
    doc.font("Times-Roman").fontSize(19).fillColor("#1c1815").text("Calorie Summary", 42, curY);
    curY += 24;

    const calCardW = (doc.page.width - 100) / 2;
    const calCardH = 88;

    // Card 1: Daily Calories Consumed
    doc.roundedRect(42, curY, calCardW, calCardH, 6).lineWidth(0.6).stroke("#e5e0d8");
    doc.font("Helvetica-Bold").fontSize(6.5).fillColor("#8a7e72").text("DAILY CALORIES CONSUMED", 54, curY + 12, { characterSpacing: 0.8 });
    doc.font("Times-Roman").fontSize(18).fillColor("#1c1815").text(`${avgCals}`, 54, curY + 28, { continued: true });
    doc.font("Times-Roman").fontSize(10).fillColor("#8a7e72").text(" kcal avg");

    // Mini 7-day bars for consumed
    const barBaseY1 = curY + 64;
    let barX1 = 54;
    const daysLetter = ["M", "T", "W", "T", "F", "S", "S"];
    daysLetter.forEach((l) => {
      doc.roundedRect(barX1, barBaseY1 - 5, 18, 3.5, 1.5).fill("#b8997a");
      doc.font("Helvetica").fontSize(6.5).fillColor("#8a7e72").text(l, barX1, barBaseY1 + 4, { width: 18, align: "center" });
      barX1 += 25;
    });

    // Card 2: Net Calories (Deficit / Surplus)
    const card2X = 42 + calCardW + 16;
    doc.roundedRect(card2X, curY, calCardW, calCardH, 6).lineWidth(0.6).stroke("#e5e0d8");
    doc.font("Helvetica-Bold").fontSize(6.5).fillColor("#8a7e72").text("NET CALORIES (DEFICIT / SURPLUS)", card2X + 12, curY + 12, { characterSpacing: 0.8 });

    let netCalsDisplay = "0";
    if (tdeeVal > 0 && foodDaysCount > 0) {
      const diff = avgCals - tdeeVal;
      netCalsDisplay = diff > 0 ? `+${diff}` : `${diff}`;
    }
    doc.font("Times-Roman").fontSize(18).fillColor("#1c1815").text(`${netCalsDisplay}`, card2X + 12, curY + 28, { continued: true });
    doc.font("Times-Roman").fontSize(10).fillColor("#8a7e72").text(" kcal avg");

    // Mini 7-day bars for net
    const barBaseY2 = curY + 64;
    let barX2 = card2X + 12;
    daysLetter.forEach((l) => {
      doc.roundedRect(barX2, barBaseY2 - 5, 18, 3.5, 1.5).fill("#b8997a");
      doc.font("Helvetica").fontSize(6.5).fillColor("#8a7e72").text(l, barX2, barBaseY2 + 4, { width: 18, align: "center" });
      barX2 += 25;
    });

    curY += calCardH + 28;

    // Divider
    doc.moveTo(42, curY).lineTo(doc.page.width - 42, curY).lineWidth(0.5).stroke("#e5e0d8");
    curY += 20;

    // SECTION 4: BODY METRICS / Health Indicators
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#8a7e72").text("BODY METRICS", 42, curY, { characterSpacing: 1.8 });
    curY += 12;
    doc.font("Times-Roman").fontSize(19).fillColor("#1c1815").text("Health Indicators", 42, curY);
    curY += 24;

    const indCardW = (doc.page.width - 104) / 3;
    const indCardH = 66;

    const indMetrics = [
      { title: "BMI", val: `${bmiVal}`, sub: bmiLabel, unit: "" },
      { title: "WEIGHT", val: `${weightVal}`, sub: "Current", unit: " kg" },
      { title: "HEIGHT", val: `${heightVal}`, sub: "—", unit: " cm" },
      { title: "BMR", val: `${bmrVal.toLocaleString()}`, sub: "Resting burn", unit: " kcal" },
      { title: "TDEE", val: `${tdeeVal.toLocaleString()}`, sub: "Total expenditure", unit: " kcal" },
      { title: "AVG STEPS/DAY", val: "0", sub: "Weekly average", unit: "" }
    ];

    indMetrics.forEach((m, idx) => {
      const row = Math.floor(idx / 3);
      const col = idx % 3;
      const cardX = 42 + col * (indCardW + 10);
      const cardY = curY + row * (indCardH + 10);

      doc.roundedRect(cardX, cardY, indCardW, indCardH, 6).lineWidth(0.6).stroke("#e5e0d8");
      doc.font("Helvetica-Bold").fontSize(6.5).fillColor("#8a7e72").text(m.title, cardX + 12, cardY + 10, { characterSpacing: 0.8 });

      doc.font("Times-Roman").fontSize(17).fillColor("#1c1815").text(m.val, cardX + 12, cardY + 24, { continued: true });
      if (m.unit) {
        doc.font("Times-Roman").fontSize(10).fillColor("#666").text(m.unit);
      } else {
        doc.text("");
      }

      doc.font("Helvetica").fontSize(7.5).fillColor("#8a7e72").text(m.sub, cardX + 12, cardY + 47);
    });

    // =========================================================================
    // PAGE 3: Analysis & Weekly Insights (Header + Cards grouped together)
    // =========================================================================
    doc.addPage();
    curY = 40;

    // SECTION 5: ANALYSIS / Weekly Insights
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#8a7e72").text("ANALYSIS", 42, curY, { characterSpacing: 1.8 });
    curY += 12;
    doc.font("Times-Roman").fontSize(19).fillColor("#1c1815").text("Weekly Insights", 42, curY);
    curY += 24;

    // Dynamic Insights matching reference text
    let habitInsight = "Room for improvement. You hit 0% completion. Try focusing on your easiest habits first to build momentum.";
    if (overallHabitRate === 100) {
      habitInsight = "Outstanding performance! You hit 100% completion across all your daily wellness habits this week.";
    } else if (overallHabitRate >= 70) {
      habitInsight = `Great momentum! You hit ${overallHabitRate}% completion. Keep up the consistent progress.`;
    } else if (overallHabitRate > 0) {
      habitInsight = `Room for improvement. You hit ${overallHabitRate}% completion. Try focusing on your easiest habits first to build momentum.`;
    }

    let nutritionInsight = "Perfectly balanced. Calories in matched calories out this week!";
    if (foodDaysCount > 0 && tdeeVal > 0) {
      if (avgCals < tdeeVal - 300) {
        nutritionInsight = `Caloric deficit active. Averaged ${avgCals} kcal/day compared to your estimated ${tdeeVal} kcal expenditure.`;
      } else if (avgCals > tdeeVal + 300) {
        nutritionInsight = `Caloric surplus active. Averaged ${avgCals} kcal/day compared to your estimated ${tdeeVal} kcal expenditure.`;
      }
    }

    const stepInsight = "Step count below target. Averaged 0 steps/day. Try short walks after meals to hit that 10k mark.";

    const insightsList = [habitInsight, nutritionInsight, stepInsight];

    insightsList.forEach(text => {
      const cardW = doc.page.width - 84;
      doc.roundedRect(42, curY, cardW, 44, 6).lineWidth(0.6).stroke("#e5e0d8");
      doc.font("Helvetica").fontSize(9).fillColor("#241e1b").text(text, 56, curY + 13, { width: cardW - 28, lineGap: 2.5 });
      curY += 56;
    });

    curY += 24;

    // Divider
    doc.moveTo(42, curY).lineTo(doc.page.width - 42, curY).lineWidth(0.5).stroke("#e5e0d8");
    curY += 28;

    // Bottom Footer
    doc.font("Times-Roman").fontSize(13).fillColor("#6e6358").text("life·track", 42, curY);
    doc.font("Helvetica").fontSize(7.5).fillColor("#8a7e72").text(`Generated ${generatedFormatted}`, doc.page.width - 242, curY, { width: 200, align: "right" });
    doc.font("Helvetica").fontSize(7.5).fillColor("#8a7e72").text("Personal data — for private use only", doc.page.width - 242, curY + 12, { width: 200, align: "right" });

    doc.end();
  });
};
