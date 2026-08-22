const PDFDocument = require("pdfkit");
const db = require("../config/db");

exports.generateWeeklyPDF = async (userId, trackData = {}, allHabits = []) => {
  // 1. Calculate strictly Monday to Sunday in local server time
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const startStr = weekStart.toISOString().slice(0, 10); // Not perfect if UTC offset shifts the date, but lets use local format
  
  // Format local date strings: YYYY-MM-DD
  const fmtDate = (d) => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${yr}-${mo}-${da}`;
  };

  const weekStartStr = fmtDate(weekStart);
  const weekEndStr = fmtDate(weekEnd);

  // Generate array of 7 day strings
  const weekDaysStr = [];
  for(let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    weekDaysStr.push(fmtDate(d));
  }
  const todayStr = fmtDate(now);

  // Fetch DB Data
  const [userRows] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
  const user = userRows[0] || {};
  const name = user.username || "User";

  const [food] = await db.query(
    "SELECT log_date, SUM(calories) as total_calories FROM food_logs WHERE user_id = ? AND log_date >= ? AND log_date <= ? GROUP BY log_date",
    [userId, weekStartStr, weekEndStr]
  );

  // Process food
  const foodMap = {};
  let totalCals = 0;
  let foodDaysCount = 0;
  food.forEach(f => {
    // f.log_date might be a Date object from pg
    const dStr = f.log_date instanceof Date ? fmtDate(f.log_date) : String(f.log_date).slice(0,10);
    const cals = Number(f.total_calories);
    foodMap[dStr] = cals;
    totalCals += cals;
    foodDaysCount++;
  });
  const avgCals = foodDaysCount > 0 ? Math.round(totalCals / foodDaysCount) : 0;

  // Process Habits
  let totalChecks = 0;
  let totalPossible = 0;
  
  // We need to determine if a day is in the future
  const isFuture = (dStr) => {
    return dStr > todayStr; // simple string comparison works for YYYY-MM-DD
  };

  const habitsWithStats = allHabits.map(h => {
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

  // PDF Generation
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const buffers = [];
  doc.on("data", buffers.push.bind(buffers));

  return new Promise((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    // PAGE 1
    doc.rect(0, 0, doc.page.width, 220).fill("#1a1715");
    
    doc.fillColor("#e4d9c7").fontSize(12).text("life · track", 40, 40);
    
    doc.roundedRect(doc.page.width - 150, 35, 110, 24, 12).lineWidth(1).stroke("#c19c72");
    doc.fillColor("#c19c72").fontSize(8).text("WEEKLY REPORT", doc.page.width - 150, 43, { width: 110, align: "center", characterSpacing: 1.5 });

    doc.fillColor("#f3f0e8").fontSize(38).text("Wellness", 40, 90);
    doc.fillColor("#c19c72").fontSize(38).text("Report", 40, 130);
    doc.fillColor("#867b73").fontSize(10).text("PERSONAL HEALTH & HABIT SUMMARY", 40, 175, { characterSpacing: 1 });

    doc.fontSize(7).text("MEMBER", 40, 205);
    doc.fillColor("#f3f0e8").fontSize(10).text(name, 40, 215);

    const periodStr = `${weekStart.toLocaleDateString("en-US", {month:"short", day:"numeric"})} - ${weekEnd.toLocaleDateString("en-US", {month:"short", day:"numeric"})}`;
    doc.fillColor("#867b73").fontSize(7).text("PERIOD", 160, 205);
    doc.fillColor("#f3f0e8").fontSize(10).text(periodStr, 160, 215);
    
    doc.fillColor("#867b73").fontSize(7).text("GENERATED", 280, 205);
    doc.fillColor("#f3f0e8").fontSize(10).text(now.toLocaleDateString("en-US", {month:"short", day:"numeric", year:"numeric"}), 280, 215);

    let y = 250;
    
    // Overview
    doc.fillColor("#555").fontSize(8).text("OVERVIEW", 40, y, { characterSpacing: 1 });
    y += 15;
    doc.fillColor("#333").fontSize(20).text("Week at a Glance", 40, y);
    y += 35;

    doc.roundedRect(40, y, doc.page.width - 80, 80, 4).lineWidth(0.5).stroke("#ddd");
    
    const colW = (doc.page.width - 80)/4;
    doc.fillColor("#5b7a5a").fontSize(22).text(`${overallHabitRate}%`, 40, y + 20, { width: colW, align: "center" });
    doc.fillColor("#777").fontSize(8).text("HABIT COMPLETION", 40, y + 55, { width: colW, align: "center" });

    doc.fillColor("#8e7256").fontSize(22).text(`${bestOverallStreak}`, 40 + colW, y + 20, { width: colW, align: "center" });
    doc.fillColor("#777").fontSize(8).text("BEST STREAK", 40 + colW, y + 55, { width: colW, align: "center" });

    doc.fillColor("#5b7a5a").fontSize(22).text(`${avgCals} kcal`, 40 + colW*2, y + 20, { width: colW, align: "center" });
    doc.fillColor("#777").fontSize(8).text("AVG DAILY INTAKE", 40 + colW*2, y + 55, { width: colW, align: "center" });

    doc.fillColor("#5b7a5a").fontSize(22).text("0 steps", 40 + colW*3, y + 20, { width: colW, align: "center" });
    doc.fillColor("#777").fontSize(8).text("TOTAL STEPS", 40 + colW*3, y + 55, { width: colW, align: "center" });

    y += 120;
    doc.moveTo(40, y).lineTo(doc.page.width - 40, y).lineWidth(1).stroke("#eee");
    y += 30;

    // Daily Habits
    doc.fillColor("#555").fontSize(8).text("DAILY HABITS", 40, y, { characterSpacing: 1 });
    y += 15;
    doc.fillColor("#333").fontSize(20).text("Habit Tracker", 40, y);
    y += 40;

    doc.fillColor("#777").fontSize(8).text("HABIT", 40, y);
    let colX = 170;
    ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].forEach(d => {
      doc.text(d, colX, y, { width: 30, align: "center" });
      colX += 35;
    });
    doc.text("RATE", colX + 5, y);
    doc.text("STREAK", colX + 45, y);
    
    y += 15;
    doc.moveTo(40, y).lineTo(doc.page.width - 40, y).lineWidth(1).stroke("#ddd");
    y += 15;

    habitsWithStats.forEach(h => {
      if (y > doc.page.height - 100) {
        doc.addPage();
        y = 40;
      }

      doc.roundedRect(40, y-5, 30, 30, 8).stroke("#ddd");
      doc.fillColor("#333").fontSize(14).text(h.icon || "?", 40, y+2, { width: 30, align: "center" });
      
      doc.fillColor("#111").fontSize(10).text(h.name, 80, y);
      doc.fillColor("#777").fontSize(8).text(h.sub || "Daily habit", 80, y+14, { width: 80, height: 12, lineBreak: false });

      let dayX = 170;
      h.days.forEach(day => {
        if (day.future) {
          doc.roundedRect(dayX, y, 22, 22, 4).fillAndStroke("#f5f5f5", "#eeeeee");
          doc.fillColor("#aaaaaa").fontSize(10).text("-", dayX, y+6, { width: 22, align: "center" });
        } else if (day.done) {
          doc.roundedRect(dayX, y, 22, 22, 4).fillAndStroke("#eaf5ea", "#d1e8d1");
          doc.fillColor("#4a8a4a").fontSize(10).text("?", dayX, y+6, { width: 22, align: "center" });
        } else {
          doc.roundedRect(dayX, y, 22, 22, 4).fillAndStroke("#faeaea", "#f5dcdc");
          doc.fillColor("#c97272").fontSize(10).text("?", dayX, y+6, { width: 22, align: "center" });
        }
        dayX += 35;
      });
      
      doc.fillColor("#111").fontSize(10).text(`${h.rate}%`, dayX + 5, y + 6);
      
      doc.roundedRect(dayX + 45, y-5, 30, 30, 15).stroke("#ffecd1");
      doc.fillColor("#ff9900").fontSize(10).text("??", dayX + 45, y);
      doc.fillColor("#888").fontSize(8).text(`${h.maxStreak}`, dayX + 45, y+15, { width: 30, align: "center" });

      y += 45;
      doc.moveTo(40, y).lineTo(doc.page.width - 40, y).stroke("#eee");
      y += 15;
    });

    // PAGE 2 (Body & Calorie)
    doc.addPage();
    y = 40;

    doc.fillColor("#555").fontSize(8).text("NUTRITION", 40, y, { characterSpacing: 1 });
    y += 15;
    doc.fillColor("#333").fontSize(20).text("Calorie Summary", 40, y);
    y += 40;

    // Calorie logic
    doc.roundedRect(40, y, (doc.page.width - 100)/2, 100, 8).stroke("#ddd");
    doc.fillColor("#777").fontSize(8).text("DAILY CALORIES CONSUMED", 55, y + 15);
    
    if (foodDaysCount === 0) {
      doc.fillColor("#111").fontSize(14).text("No calorie data recorded", 55, y + 40);
    } else {
      doc.fillColor("#333").fontSize(22).text(`${avgCals}`, 55, y + 40, { continued: true }).fillColor("#777").fontSize(10).text(" kcal avg");
    }

    const tdee = user.weight && user.height && user.age ? 
      Math.round((10 * user.weight + 6.25 * user.height - 5 * user.age + (user.gender === "male" ? 5 : -161)) * 1.2) : 0;
    const bmr = tdee > 0 ? Math.round(tdee / 1.2) : 0;

    let netCals = "No data";
    if (tdee > 0 && foodDaysCount > 0) {
      const diff = avgCals - tdee;
      netCals = diff > 0 ? `+${diff}` : `${diff}`;
    }

    doc.roundedRect(doc.page.width/2 + 10, y, (doc.page.width - 100)/2, 100, 8).stroke("#ddd");
    doc.fillColor("#777").fontSize(8).text("NET CALORIES (DEFICIT / SURPLUS)", doc.page.width/2 + 25, y + 15);
    
    if (foodDaysCount === 0 || tdee === 0) {
      doc.fillColor("#111").fontSize(14).text("No calorie data recorded", doc.page.width/2 + 25, y + 40);
    } else {
      doc.fillColor("#333").fontSize(22).text(`${netCals}`, doc.page.width/2 + 25, y + 40, { continued: true }).fillColor("#777").fontSize(10).text(" kcal avg");
    }

    y += 140;
    doc.moveTo(40, y).lineTo(doc.page.width - 40, y).lineWidth(1).stroke("#eee");
    y += 30;

    doc.fillColor("#555").fontSize(8).text("BODY METRICS", 40, y, { characterSpacing: 1 });
    y += 15;
    doc.fillColor("#333").fontSize(20).text("Health Indicators", 40, y);
    y += 40;

    let bmi = "—";
    let bmiLabel = "—";
    if (user.weight && user.height) {
      const hM = user.height / 100;
      const b = user.weight / (hM * hM);
      bmi = b.toFixed(1);
      if (b < 18.5) bmiLabel = "Underweight";
      else if (b < 25) bmiLabel = "Normal";
      else if (b < 30) bmiLabel = "Overweight";
      else bmiLabel = "Obese";
    }

    const cards = [
      { title: "BMI", val: bmi, sub: bmiLabel },
      { title: "WEIGHT", val: user.weight ? `${user.weight} kg` : "—", sub: "Current" },
      { title: "HEIGHT", val: user.height ? `${user.height} cm` : "—", sub: "—" },
      { title: "BMR", val: bmr ? `${bmr} kcal` : "—", sub: "Resting burn" },
      { title: "TDEE", val: tdee ? `${tdee} kcal` : "—", sub: "Total expenditure" },
      { title: "AVG STEPS/DAY", val: "No data", sub: "Weekly average" }
    ];

    let cx = 40;
    let cy = y;
    cards.forEach((c, i) => {
      doc.roundedRect(cx, cy, 150, 90, 8).stroke("#ddd");
      doc.fillColor("#777").fontSize(8).text(c.title, cx + 15, cy + 15);
      doc.fillColor("#333").fontSize(22).text(c.val, cx + 15, cy + 40);
      doc.fillColor("#777").fontSize(9).text(c.sub, cx + 15, cy + 70);
      cx += 170;
      if ((i + 1) % 3 === 0) {
        cx = 40;
        cy += 110;
      }
    });

    y = cy + 40;
    doc.moveTo(40, y).lineTo(doc.page.width - 40, y).lineWidth(1).stroke("#eee");
    y += 30;

    // PAGE 3 (Insights)
    if (y > doc.page.height - 200) {
      doc.addPage();
      y = 40;
    }

    doc.fillColor("#555").fontSize(8).text("ANALYSIS", 40, y, { characterSpacing: 1 });
    y += 15;
    doc.fillColor("#333").fontSize(20).text("Weekly Insights", 40, y);
    y += 40;

    // Dynamic Insights
    if (totalPossible === 0) {
      doc.roundedRect(40, y, doc.page.width - 80, 50, 8).stroke("#ddd");
      doc.fillColor("#111").fontSize(10).text("No habit activity was recorded this week.", 55, y + 20);
      y += 70;
    } else {
      let insight1 = "";
      if (overallHabitRate === 100) insight1 = "Flawless execution! You hit 100% completion on all tracked habits this week.";
      else if (overallHabitRate > 70) insight1 = `Great momentum. You completed ${overallHabitRate}% of your habits.`;
      else insight1 = `Room for improvement. You hit ${overallHabitRate}% completion. Try focusing on your easiest habits first to build momentum.`;
      
      doc.roundedRect(40, y, doc.page.width - 80, 50, 8).stroke("#ddd");
      doc.fillColor("#111").fontSize(10).text(insight1, 55, y + 20);
      y += 70;
    }

    if (foodDaysCount === 0) {
      doc.roundedRect(40, y, doc.page.width - 80, 50, 8).stroke("#ddd");
      doc.fillColor("#111").fontSize(10).text("No calorie data was recorded this week.", 55, y + 20);
      y += 70;
    } else {
      let insight2 = "";
      if (avgCals < tdee - 200) insight2 = "Caloric deficit detected. You are consuming less energy than you burn on average.";
      else if (avgCals > tdee + 200) insight2 = "Caloric surplus detected. You are consuming more energy than you burn on average.";
      else insight2 = "Perfectly balanced. Calories in matched calories out this week!";

      doc.roundedRect(40, y, doc.page.width - 80, 50, 8).stroke("#ddd");
      doc.fillColor("#111").fontSize(10).text(insight2, 55, y + 20);
      y += 70;
    }

    doc.roundedRect(40, y, doc.page.width - 80, 50, 8).stroke("#ddd");
    doc.fillColor("#111").fontSize(10).text("No step data was recorded this week.", 55, y + 20);
    y += 70;

    // Footer
    y = doc.page.height - 60;
    doc.moveTo(40, y).lineTo(doc.page.width - 40, y).lineWidth(2).stroke("#f0ede6");
    y += 20;
    doc.fillColor("#867b73").fontSize(12).text("life · track", 40, y);
    
    doc.fontSize(8).text(`Generated ${now.toLocaleDateString("en-US", {month:"short", day:"numeric", year:"numeric"})}`, doc.page.width - 200, y, { width: 160, align: "right" });
    doc.text("Personal data — for private use only", doc.page.width - 200, y + 12, { width: 160, align: "right" });

    doc.end();
  });
};

