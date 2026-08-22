const PDFDocument = require("pdfkit");
const db = require("../config/db");

exports.generateWeeklyPDF = async (userId) => {
  const now = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(now.getDate() - 7);

  const fromDate = lastWeek.toISOString().slice(0, 10);
  const toDate = now.toISOString().slice(0, 10);

  // Fetch user data
  const [userRows] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
  const user = userRows[0] || {};
  const name = user.username || "User";

  const [food] = await db.query(
    "SELECT log_date, SUM(calories) as total_calories FROM food_logs WHERE user_id = ? AND log_date BETWEEN ? AND ? GROUP BY log_date",
    [userId, fromDate, toDate]
  );
  
  const [tasks] = await db.query(
    "SELECT name, day, done_this_week FROM weekly_tasks WHERE user_id = ?",
    [userId]
  );

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const buffers = [];

  doc.on("data", buffers.push.bind(buffers));

  return new Promise((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    // Header Background
    doc.rect(0, 0, doc.page.width, 220).fill("#2b2520");
    
    // Header Text
    doc.fillColor("#e4d9c7").fontSize(12).text("life · track", 40, 40);
    
    // Pill
    doc.roundedRect(doc.page.width - 150, 35, 110, 24, 12)
       .lineWidth(1).stroke("#c19c72");
    doc.fillColor("#c19c72").fontSize(8).text("WEEKLY REPORT", doc.page.width - 150, 43, { width: 110, align: "center", characterSpacing: 1.5 });

    // Title
    doc.fillColor("#f3f0e8").fontSize(38).text("Wellness", 40, 90);
    doc.fillColor("#c19c72").fontSize(38).text("Report", 40, 130);
    doc.fillColor("#867b73").fontSize(10).text("PERSONAL HEALTH & HABIT SUMMARY", 40, 175, { characterSpacing: 1 });

    // Meta Data Row
    doc.fontSize(7).text("MEMBER", 40, 205);
    doc.fillColor("#f3f0e8").fontSize(10).text(name, 40, 215);

    doc.fillColor("#867b73").fontSize(7).text("PERIOD", 140, 205);
    doc.fillColor("#f3f0e8").fontSize(10).text(`${lastWeek.toLocaleDateString()} - ${now.toLocaleDateString()}`, 140, 215);

    // Content Start
    let y = 260;
    
    // Section 1: Overview
    doc.fillColor("#555").fontSize(8).text("OVERVIEW", 40, y, { characterSpacing: 1 });
    y += 15;
    doc.fillColor("#333").fontSize(20).text("Week at a Glance", 40, y);
    y += 35;

    // Overview Box
    doc.roundedRect(40, y, doc.page.width - 80, 80, 4).lineWidth(0.5).stroke("#ddd");
    
    // Overview Stats
    doc.fillColor("#5b7a5a").fontSize(22).text("0%", 40, y + 20, { width: (doc.page.width - 80)/4, align: "center" });
    doc.fillColor("#777").fontSize(8).text("HABIT COMPLETION", 40, y + 55, { width: (doc.page.width - 80)/4, align: "center" });

    doc.fillColor("#8e7256").fontSize(22).text("0", 40 + ((doc.page.width - 80)/4), y + 20, { width: (doc.page.width - 80)/4, align: "center" });
    doc.fillColor("#777").fontSize(8).text("BEST STREAK", 40 + ((doc.page.width - 80)/4), y + 55, { width: (doc.page.width - 80)/4, align: "center" });

    const totalCals = food.reduce((a, b) => a + Number(b.total_calories || 0), 0);
    const avgCals = food.length > 0 ? Math.round(totalCals / food.length) : 0;
    
    doc.fillColor("#5b7a5a").fontSize(22).text(`${avgCals} kcal`, 40 + ((doc.page.width - 80)/4)*2, y + 20, { width: (doc.page.width - 80)/4, align: "center" });
    doc.fillColor("#777").fontSize(8).text("AVG DAILY INTAKE", 40 + ((doc.page.width - 80)/4)*2, y + 55, { width: (doc.page.width - 80)/4, align: "center" });

    doc.fillColor("#5b7a5a").fontSize(22).text("0 steps", 40 + ((doc.page.width - 80)/4)*3, y + 20, { width: (doc.page.width - 80)/4, align: "center" });
    doc.fillColor("#777").fontSize(8).text("TOTAL STEPS", 40 + ((doc.page.width - 80)/4)*3, y + 55, { width: (doc.page.width - 80)/4, align: "center" });

    y += 120;
    doc.moveTo(40, y).lineTo(doc.page.width - 40, y).lineWidth(1).stroke("#eee");
    y += 30;

    // Section 2: Habit Tracker
    doc.fillColor("#555").fontSize(8).text("DAILY HABITS", 40, y, { characterSpacing: 1 });
    y += 15;
    doc.fillColor("#333").fontSize(20).text("Habit Tracker", 40, y);
    y += 40;

    // Habit Header
    doc.fillColor("#777").fontSize(8).text("HABIT", 40, y);
    let colX = 160;
    ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].forEach(d => {
      doc.text(d, colX, y, { width: 30, align: "center" });
      colX += 35;
    });
    doc.text("RATE", colX + 10, y);
    doc.text("STREAK", colX + 60, y);
    
    y += 20;
    doc.moveTo(40, y).lineTo(doc.page.width - 40, y).lineWidth(1).stroke("#ddd");
    y += 20;

    // Draw Habits (Mocking layout from PDF)
    const habitList = [
      { name: "Skincare", desc: "Morning & night routine", icon: "✦" },
      { name: "Proper Diet", desc: "Balanced meals today", icon: "◈" },
      { name: "Walking Steps", desc: "Daily step goal", icon: "◉" }
    ];

    habitList.forEach(h => {
      doc.roundedRect(40, y-5, 30, 30, 8).stroke("#ddd");
      doc.fillColor("#333").fontSize(14).text(h.icon, 40, y+2, { width: 30, align: "center" });
      
      doc.fillColor("#111").fontSize(10).text(h.name, 80, y);
      doc.fillColor("#777").fontSize(8).text(h.desc, 80, y+14);

      let dayX = 160;
      for(let i=0; i<7; i++) {
        doc.roundedRect(dayX, y, 22, 22, 4).fillAndStroke("#faeaea", "#f5dcdc");
        doc.fillColor("#c97272").fontSize(10).text("x", dayX, y+6, { width: 22, align: "center" });
        dayX += 35;
      }
      
      doc.fillColor("#111").fontSize(10).text("0%", dayX + 10, y + 6);
      
      doc.roundedRect(dayX + 60, y-5, 30, 30, 15).stroke("#ffecd1");
      doc.fillColor("#ff9900").fontSize(10).text("\"", dayX + 60, y);
      doc.fillColor("#888").fontSize(8).text("0", dayX + 60, y+15, { width: 30, align: "center" });

      y += 50;
      doc.moveTo(40, y).lineTo(doc.page.width - 40, y).stroke("#eee");
      y += 20;
    });

    doc.addPage();
    y = 40;

    // Body Metrics
    doc.fillColor("#555").fontSize(8).text("BODY METRICS", 40, y, { characterSpacing: 1 });
    y += 15;
    doc.fillColor("#333").fontSize(20).text("Health Indicators", 40, y);
    y += 40;

    // Cards
    const cards = [
      { title: "WEIGHT", val: user.weight ? `${user.weight} kg` : "—", sub: "Current" },
      { title: "HEIGHT", val: user.height ? `${user.height} cm` : "—", sub: "—" },
      { title: "GOAL", val: user.goal ? user.goal.toUpperCase() : "—", sub: "Target" }
    ];

    let cx = 40;
    cards.forEach(c => {
      doc.roundedRect(cx, y, 150, 90, 8).stroke("#ddd");
      doc.fillColor("#777").fontSize(8).text(c.title, cx + 15, y + 15);
      doc.fillColor("#333").fontSize(22).text(c.val, cx + 15, y + 40);
      doc.fillColor("#777").fontSize(9).text(c.sub, cx + 15, y + 70);
      cx += 170;
    });

    y += 120;
    
    // Insights
    doc.fillColor("#555").fontSize(8).text("ANALYSIS", 40, y, { characterSpacing: 1 });
    y += 15;
    doc.fillColor("#333").fontSize(20).text("Weekly Insights", 40, y);
    y += 40;

    doc.roundedRect(40, y, doc.page.width - 80, 50, 8).stroke("#ddd");
    doc.fillColor("#111").fontSize(10).text("Room for improvement. You hit 0% completion. Try focusing on easiest habits first.", 55, y + 20);

    y += 70;
    doc.roundedRect(40, y, doc.page.width - 80, 50, 8).stroke("#ddd");
    doc.fillColor("#111").fontSize(10).text("Perfectly balanced. Calories in matched calories out this week!", 55, y + 20);

    y += 100;
    doc.fillColor("#777").fontSize(8).text("life · track", 40, y);
    doc.text("Generated " + new Date().toDateString(), doc.page.width - 150, y);

    doc.end();
  });
};

