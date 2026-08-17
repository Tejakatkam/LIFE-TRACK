const cron = require("node-cron");
const db = require("../config/db");
const { sendEmail } = require("./emailService");
const { generateWeeklyPDF } = require("./reportGenerator");

cron.schedule("* * * * *", async () => {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  const today = now.toLocaleString("en-US", { weekday: "long" });

  console.log("Checking reminders at", currentTime);

  try {
    // 🔔 DAILY REMINDERS
    const [reminders] = await db.query(
      `SELECT r.*, u.email
       FROM reminders r
       JOIN users u ON r.user_id = u.id
       WHERE r.time = ?`,
      [currentTime],
    );

    for (let r of reminders) {
      if (!r.email) continue;

      const message = `Reminder: ${r.habit_name}
${r.label ? "Note: " + r.label : ""}

Stay consistent 💪`;

      await sendEmail({
        to: r.email,
        subject: "LifeTrack Reminder",
        text: message
      });
    }

    // 📅 WEEKLY TASKS
    const [weekly] = await db.query(
      `SELECT w.*, u.email
       FROM weekly_tasks w
       JOIN users u ON w.user_id = u.id
       WHERE w.day = ? AND w.reminder_time = ?`,
      [today, currentTime],
    );

    for (let t of weekly) {
      if (!t.email) continue;

      const message = `Weekly Task: ${t.name}

Today is ${today}.
Don't forget to complete it ✔`;

      await sendEmail({
        to: t.email,
        subject: "LifeTrack Weekly Task",
        text: message
      });
    }
  } catch (err) {
    console.error("Scheduler error:", err);
  }
});

// Every Sunday at 6 PM
cron.schedule("0 18 * * 0", async () => {
  console.log("Running weekly auto email...");

  try {
    const [users] = await db.query("SELECT id, email FROM users");

    for (let user of users) {
      if (!user.email) continue;

      const pdfBuffer = await generateWeeklyPDF(user.id);

      await sendEmail({
        to: user.email,
        subject: "Your LifeTrack Weekly Report",
        text: "Attached is your weekly progress report 📊",
        attachments: [
          {
            filename: "weekly_report.pdf",
            content: pdfBuffer,
          },
        ],
      });
    }

    console.log("Weekly reports sent successfully");
  } catch (err) {
    console.error("Weekly email error:", err);
  }
});
