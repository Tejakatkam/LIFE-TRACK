const db = require("../config/db");
const PDFDocument = require("pdfkit");

exports.generateWeeklyPDF = async (userId) => {
  const now = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(now.getDate() - 7);

  const fromDate = lastWeek.toISOString().slice(0, 10);
  const toDate = now.toISOString().slice(0, 10);

  const [food] = await db.query(
    `SELECT log_date, SUM(calories) as total_calories
     FROM food_logs
     WHERE user_id = ? AND log_date BETWEEN ? AND ?
     GROUP BY log_date`,
    [userId, fromDate, toDate],
  );

  const [tasks] = await db.query(
    `SELECT name, day, done_this_week
     FROM weekly_tasks
     WHERE user_id = ?`,
    [userId],
  );

  const doc = new PDFDocument();
  const buffers = [];

  doc.on("data", buffers.push.bind(buffers));

  return new Promise((resolve) => {
    doc.on("end", () => {
      resolve(Buffer.concat(buffers));
    });

    doc.fontSize(20).text("LifeTrack Weekly Report", { align: "center" });
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
  });
};
