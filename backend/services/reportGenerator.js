const PDFDocument = require("pdfkit");
const db = require("../config/db");

exports.generateWeeklyPDF = async (userId, trackData = {}, allHabits = []) => {
  // 1. Calculate strictly Monday to Sunday in local time
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

  // Default fallback habits matching exact reference
  const defaultHabitList = [
    { id: "skincare", name: "Skincare", sub: "Morning &\nnight\nroutine", icon: "✦" },
    { id: "diet", name: "Proper\nDiet", sub: "Balanced\nmeals\ntoday", icon: "◈" },
    { id: "steps", name: "Walking\nSteps", sub: "Daily step\ngoal", icon: "◉" },
    { id: "water", name: "Water\nIntake", sub: "Stay\nhydrated", icon: "◇" },
    { id: "sleep", name: "Quality\nSleep", sub: "Restful\nsleep", icon: "◑" }
  ];

  const sourceHabits = allHabits.length > 0 ? allHabits.map((h, i) => ({
    id: h.id,
    name: h.name.includes("\n") ? h.name : (h.name.length > 10 ? h.name.replace(" ", "\n") : h.name),
    sub: h.sub || defaultHabitList[i % defaultHabitList.length]?.sub || "Daily habit",
    icon: h.icon || defaultHabitList[i % defaultHabitList.length]?.icon || "✦"
  })) : defaultHabitList;

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

  // PDFKit Document Creation
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const buffers = [];
  doc.on("data", buffers.push.bind(buffers));

  return new Promise((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    // =========================================================================
    // PAGE 1: Header Banner + Overview + Habit Tracker (Part 1: 3 habits)
    // =========================================================================

    // Top Dark Banner
    doc.rect(0, 0, doc.page.width, 210).fill("#1e1916");

    // Top Brand & Pill
    doc.font("Times-Roman").fontSize(13).fillColor("#e4d9c7").text("life·track", 45, 36);

    doc.roundedRect(doc.page.width - 165, 32, 120, 22, 11).lineWidth(0.8).stroke("#57473a");
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#c5a073").text("WEEKLY REPORT", doc.page.width - 165, 39, { width: 120, align: "center", characterSpacing: 1.5 });

    // Decorative Arc
    doc.save();
    doc.lineWidth(1).strokeColor("#332822");
    doc.moveTo(doc.page.width * 0.45, 0).bezierCurveTo(doc.page.width * 0.55, 120, doc.page.width * 0.8, 180, doc.page.width, 180).stroke();
    doc.restore();

    // Main Titles
    doc.font("Times-Roman").fontSize(38).fillColor("#f7f4ed").text("Wellness", 45, 82);
    doc.font("Times-Italic").fontSize(38).fillColor("#c5a073").text("Report", 45, 122);
    doc.font("Helvetica").fontSize(8).fillColor("#8e8275").text("PERSONAL HEALTH & HABIT SUMMARY", 45, 168, { characterSpacing: 1.2 });

    // 3-Column Metadata Bar
    const metaY = 188;
    doc.font("Helvetica-Bold").fontSize(6.5).fillColor("#8e8275").text("MEMBER", 45, metaY, { characterSpacing: 1.2 });
    doc.font("Times-Roman").fontSize(11).fillColor("#f7f4ed").text(memberName, 45, metaY + 9);

    const periodFormatted = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    doc.font("Helvetica-Bold").fontSize(6.5).fillColor("#8e8275").text("PERIOD", 160, metaY, { characterSpacing: 1.2 });
    doc.font("Times-Roman").fontSize(11).fillColor("#f7f4ed").text(periodFormatted, 160, metaY + 9);

    const generatedFormatted = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    doc.font("Helvetica-Bold").fontSize(6.5).fillColor("#8e8275").text("GENERATED", 275, metaY, { characterSpacing: 1.2 });
    doc.font("Times-Roman").fontSize(11).fillColor("#f7f4ed").text(generatedFormatted, 275, metaY + 9);

    let curY = 245;

    // SECTION 1: OVERVIEW / Week at a Glance
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#8e8275").text("OVERVIEW", 45, curY, { characterSpacing: 1.5 });
    curY += 13;
    doc.font("Times-Roman").fontSize(20).fillColor("#1e1916").text("Week at a Glance", 45, curY);
    curY += 28;

    // 4-Column Stat Box
    const boxW = doc.page.width - 90;
    const boxH = 68;
    doc.roundedRect(45, curY, boxW, boxH, 4).lineWidth(0.6).stroke("#e6e1da");

    const statColW = boxW / 4;
    // Col 1: Habit Completion
    doc.font("Times-Roman").fontSize(20).fillColor("#1e1916").text(`${overallHabitRate}`, 45, curY + 16, { width: statColW - 10, align: "center", continued: true });
    doc.font("Helvetica").fontSize(10).fillColor("#777").text(" %");
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#8e8275").text("HABIT COMPLETION", 45, curY + 44, { width: statColW, align: "center", characterSpacing: 0.8 });

    // Col 2: Best Streak
    doc.font("Times-Roman").fontSize(20).fillColor("#1e1916").text(`${bestOverallStreak}`, 45 + statColW, curY + 16, { width: statColW, align: "center" });
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#8e8275").text("BEST STREAK", 45 + statColW, curY + 44, { width: statColW, align: "center", characterSpacing: 0.8 });

    // Col 3: Avg Daily Intake
    doc.font("Times-Roman").fontSize(20).fillColor("#1e1916").text(`${avgCals}`, 45 + statColW * 2, curY + 16, { width: statColW - 15, align: "center", continued: true });
    doc.font("Helvetica").fontSize(10).fillColor("#777").text(" kcal");
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#8e8275").text("AVG DAILY INTAKE", 45 + statColW * 2, curY + 44, { width: statColW, align: "center", characterSpacing: 0.8 });

    // Col 4: Total Steps
    doc.font("Times-Roman").fontSize(20).fillColor("#1e1916").text("0", 45 + statColW * 3, curY + 16, { width: statColW - 15, align: "center", continued: true });
    doc.font("Helvetica").fontSize(10).fillColor("#777").text(" steps");
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#8e8275").text("TOTAL STEPS", 45 + statColW * 3, curY + 44, { width: statColW, align: "center", characterSpacing: 0.8 });

    curY += boxH + 32;

    // Divider
    doc.moveTo(45, curY).lineTo(doc.page.width - 45, curY).lineWidth(0.5).stroke("#e6e1da");
    curY += 24;

    // SECTION 2: DAILY HABITS / Habit Tracker (Part 1)
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#8e8275").text("DAILY HABITS", 45, curY, { characterSpacing: 1.5 });
    curY += 13;
    doc.font("Times-Roman").fontSize(20).fillColor("#1e1916").text("Habit Tracker", 45, curY);
    curY += 30;

    // Table Header Function
    const renderTableHeader = (yPos) => {
      doc.font("Helvetica-Bold").fontSize(7).fillColor("#8e8275");
      doc.text("HABIT", 45, yPos, { characterSpacing: 1 });
      let dayHeaderX = 175;
      ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].forEach(d => {
        doc.text(d, dayHeaderX, yPos, { width: 32, align: "center", characterSpacing: 0.8 });
        dayHeaderX += 36;
      });
      doc.text("RATE", dayHeaderX + 10, yPos, { characterSpacing: 1 });
      doc.text("STREAK", dayHeaderX + 50, yPos, { characterSpacing: 1 });

      yPos += 14;
      doc.moveTo(45, yPos).lineTo(doc.page.width - 45, yPos).lineWidth(0.5).stroke("#e6e1da");
      return yPos + 16;
    };

    curY = renderTableHeader(curY);

    // Habit Row Renderer Function
    const renderHabitRow = (h, yPos) => {
      // Icon Box
      doc.roundedRect(45, yPos + 4, 22, 22, 5).lineWidth(0.6).stroke("#e0dacf");
      doc.font("Helvetica").fontSize(10).fillColor("#66584d").text(h.icon || "✦", 45, yPos + 9, { width: 22, align: "center" });

      // Habit Name & Subtitle
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#1e1916").text(h.name, 74, yPos + 2, { width: 90, lineGap: 1 });
      doc.font("Helvetica").fontSize(7.5).fillColor("#8e8275").text(h.sub, 74, yPos + 26, { width: 90, lineGap: 1 });

      // 7 Days Status Badges
      let dayX = 175;
      h.days.forEach(d => {
        const badgeW = 24;
        const badgeH = 22;
        if (d.future) {
          doc.roundedRect(dayX + 4, yPos + 8, badgeW, badgeH, 4).fillAndStroke("#f8f7f5", "#edeae4");
          doc.font("Helvetica").fontSize(9).fillColor("#b0a89f").text("-", dayX + 4, yPos + 13, { width: badgeW, align: "center" });
        } else if (d.done) {
          doc.roundedRect(dayX + 4, yPos + 8, badgeW, badgeH, 4).fillAndStroke("#f2f7f2", "#d6e6d6");
          doc.font("Helvetica-Bold").fontSize(9).fillColor("#488248").text("✓", dayX + 4, yPos + 13, { width: badgeW, align: "center" });
        } else {
          doc.roundedRect(dayX + 4, yPos + 8, badgeW, badgeH, 4).fillAndStroke("#fcf2f2", "#f5dcdb");
          doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#b85d5d").text("✕", dayX + 4, yPos + 14, { width: badgeW, align: "center" });
        }
        dayX += 36;
      });

      // Rate
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#1e1916").text(`${h.rate}%`, dayX + 12, yPos + 13);

      // Streak Flame & Number
      doc.font("Helvetica").fontSize(10).fillColor("#e07a3c").text("🔥", dayX + 54, yPos + 6);
      doc.font("Helvetica").fontSize(8.5).fillColor("#8e8275").text(`${h.maxStreak}`, dayX + 54, yPos + 19, { width: 16, align: "center" });

      yPos += 58;
      doc.moveTo(45, yPos).lineTo(doc.page.width - 45, yPos).lineWidth(0.5).stroke("#f0ece5");
      return yPos + 16;
    };

    // Render first 3 habits on page 1
    const p1Habits = habitsWithStats.slice(0, 3);
    p1Habits.forEach(h => {
      curY = renderHabitRow(h, curY);
    });

    // =========================================================================
    // PAGE 2: Habit Tracker (Remaining Habits) + Calorie Summary + Health Indicators
    // =========================================================================
    doc.addPage();
    curY = 45;

    // Header Table for remaining habits
    curY = renderTableHeader(curY);

    const p2Habits = habitsWithStats.slice(3);
    p2Habits.forEach(h => {
      curY = renderHabitRow(h, curY);
    });

    curY += 16;

    // SECTION 3: NUTRITION / Calorie Summary
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#8e8275").text("NUTRITION", 45, curY, { characterSpacing: 1.5 });
    curY += 13;
    doc.font("Times-Roman").fontSize(20).fillColor("#1e1916").text("Calorie Summary", 45, curY);
    curY += 28;

    const calCardW = (doc.page.width - 106) / 2;
    const calCardH = 92;

    // Card 1: Daily Calories Consumed
    doc.roundedRect(45, curY, calCardW, calCardH, 6).lineWidth(0.6).stroke("#e6e1da");
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#8e8275").text("DAILY CALORIES CONSUMED", 58, curY + 14, { characterSpacing: 0.8 });
    doc.font("Times-Roman").fontSize(18).fillColor("#1e1916").text(`${avgCals}`, 58, curY + 30, { continued: true });
    doc.font("Helvetica").fontSize(9).fillColor("#777").text(" kcal avg");

    // Mini 7-day bars for consumed
    const barBaseY1 = curY + 68;
    let barX1 = 58;
    const daysLetter = ["M", "T", "W", "T", "F", "S", "S"];
    daysLetter.forEach((l) => {
      doc.roundedRect(barX1, barBaseY1 - 5, 20, 4, 2).fill("#b8997a");
      doc.font("Helvetica").fontSize(6.5).fillColor("#8e8275").text(l, barX1, barBaseY1 + 5, { width: 20, align: "center" });
      barX1 += 26;
    });

    // Card 2: Net Calories (Deficit / Surplus)
    const card2X = 45 + calCardW + 16;
    doc.roundedRect(card2X, curY, calCardW, calCardH, 6).lineWidth(0.6).stroke("#e6e1da");
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#8e8275").text("NET CALORIES (DEFICIT / SURPLUS)", card2X + 13, curY + 14, { characterSpacing: 0.8 });
    
    let netCalsDisplay = "0";
    if (tdeeVal > 0 && foodDaysCount > 0) {
      const diff = avgCals - tdeeVal;
      netCalsDisplay = diff > 0 ? `+${diff}` : `${diff}`;
    }
    doc.font("Times-Roman").fontSize(18).fillColor("#1e1916").text(`${netCalsDisplay}`, card2X + 13, curY + 30, { continued: true });
    doc.font("Helvetica").fontSize(9).fillColor("#777").text(" kcal avg");

    // Mini 7-day bars for net
    const barBaseY2 = curY + 68;
    let barX2 = card2X + 13;
    daysLetter.forEach((l) => {
      doc.roundedRect(barX2, barBaseY2 - 5, 20, 4, 2).fill("#b8997a");
      doc.font("Helvetica").fontSize(6.5).fillColor("#8e8275").text(l, barX2, barBaseY2 + 5, { width: 20, align: "center" });
      barX2 += 26;
    });

    curY += calCardH + 32;

    // Divider
    doc.moveTo(45, curY).lineTo(doc.page.width - 45, curY).lineWidth(0.5).stroke("#e6e1da");
    curY += 24;

    // SECTION 4: BODY METRICS / Health Indicators
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#8e8275").text("BODY METRICS", 45, curY, { characterSpacing: 1.5 });
    curY += 13;
    doc.font("Times-Roman").fontSize(20).fillColor("#1e1916").text("Health Indicators", 45, curY);
    curY += 28;

    const indCardW = (doc.page.width - 110) / 3;
    const indCardH = 68;

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
      const cardX = 45 + col * (indCardW + 10);
      const cardY = curY + row * (indCardH + 10);

      doc.roundedRect(cardX, cardY, indCardW, indCardH, 6).lineWidth(0.6).stroke("#e6e1da");
      doc.font("Helvetica-Bold").fontSize(6.5).fillColor("#8e8275").text(m.title, cardX + 12, cardY + 11, { characterSpacing: 0.8 });

      doc.font("Times-Roman").fontSize(17).fillColor("#1e1916").text(m.val, cardX + 12, cardY + 26, { continued: true });
      if (m.unit) {
        doc.font("Helvetica").fontSize(8).fillColor("#666").text(m.unit);
      } else {
        doc.text("");
      }

      doc.font("Helvetica").fontSize(7.5).fillColor("#8e8275").text(m.sub, cardX + 12, cardY + 49);
    });

    curY += 2 * indCardH + 32;

    // Divider
    doc.moveTo(45, curY).lineTo(doc.page.width - 45, curY).lineWidth(0.5).stroke("#e6e1da");
    curY += 24;

    // SECTION 5: ANALYSIS / Weekly Insights (Header on Page 2)
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#8e8275").text("ANALYSIS", 45, curY, { characterSpacing: 1.5 });
    curY += 13;
    doc.font("Times-Roman").fontSize(20).fillColor("#1e1916").text("Weekly Insights", 45, curY);

    // =========================================================================
    // PAGE 3: Insights Cards + Footer
    // =========================================================================
    doc.addPage();
    curY = 45;

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
      const cardW = doc.page.width - 90;
      doc.roundedRect(45, curY, cardW, 44, 6).lineWidth(0.6).stroke("#e6e1da");
      doc.font("Helvetica").fontSize(9.5).fillColor("#241e1b").text(text, 60, curY + 12, { width: cardW - 30, lineGap: 3 });
      curY += 58;
    });

    curY += 24;

    // Divider
    doc.moveTo(45, curY).lineTo(doc.page.width - 45, curY).lineWidth(0.5).stroke("#e6e1da");
    curY += 32;

    // Bottom Footer
    doc.font("Times-Roman").fontSize(13).fillColor("#6e6358").text("life·track", 45, curY);
    doc.font("Helvetica").fontSize(7.5).fillColor("#8e8275").text(`Generated ${generatedFormatted}`, doc.page.width - 245, curY, { width: 200, align: "right" });
    doc.font("Helvetica").fontSize(7.5).fillColor("#8e8275").text("Personal data — for private use only", doc.page.width - 245, curY + 12, { width: 200, align: "right" });

    doc.end();
  });
};
