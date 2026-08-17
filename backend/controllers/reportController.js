const db = require("../config/db");
const PDFDocument = require("pdfkit");

exports.generateWeeklyReport = async (req, res) => {
  try {
    const userId = req.user.id;

    const now = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(now.getDate() - 7);

    const fromDate = lastWeek.toISOString().slice(0, 10);
    const toDate = now.toISOString().slice(0, 10);

    // Fetch food data
    const [food] = await db.query(
      `SELECT log_date, SUM(calories) as total_calories
       FROM food_logs
       WHERE user_id = ? AND log_date BETWEEN ? AND ?
       GROUP BY log_date`,
      [userId, fromDate, toDate],
    );

    // Fetch weekly tasks
    const [tasks] = await db.query(
      `SELECT name, day, done_this_week
       FROM weekly_tasks
       WHERE user_id = ?`,
      [userId],
    );

    const doc = new PDFDocument();

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=weekly_report.pdf",
    );
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    doc.fontSize(20).text("LifeTrack Weekly Report", {
      align: "center",
    });

    doc.moveDown();

    doc.fontSize(14).text("Food Summary:");
    food.forEach((f) => {
      doc.text(`${f.log_date}: ${f.total_calories || 0} kcal`);
    });

    doc.moveDown();

    doc.fontSize(14).text("Weekly Tasks:");
    tasks.forEach((t) => {
      doc.text(
        `${t.day} - ${t.name} ${t.done_this_week ? "✔ Done" : "✖ Pending"}`,
      );
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Report error" });
  }
};
