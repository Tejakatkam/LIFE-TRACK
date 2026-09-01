const cron = require("node-cron");
const db = require("../config/db");
const { sendEmail } = require("./emailService");
const { generateWeeklyPDF } = require("./reportGenerator");
const { getReminderEmailHtml } = require("../utils/emailTemplate");

cron.schedule("* * * * *", async () => {
  const now = new Date();

  // Get current HH:MM and Day across IST (Asia/Kolkata), UTC, and local server time
  const istTime = now.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const istDay = now.toLocaleDateString("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
  });

  const utcTime = now.toISOString().slice(11, 16);
  const utcDay = now.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
  });

  const localTime = now.toTimeString().slice(0, 5);
  const localDay = now.toLocaleDateString("en-US", { weekday: "long" });

  const checkTimes = [...new Set([istTime, utcTime, localTime])];
  const checkDays = [...new Set([istDay, utcDay, localDay])];

  console.log(`[Scheduler] Checking reminders for times: [${checkTimes.join(", ")}]`);

  try {
    // 🔔 DAILY REMINDERS
    const [reminders] = await db.query(
      `SELECT r.*, u.email
       FROM reminders r
       JOIN users u ON r.user_id = u.id
       WHERE r.time = ? OR r.time = ? OR r.time = ?`,
      [istTime, utcTime, localTime],
    );

    const sentReminders = new Set();
    for (let r of reminders) {
      if (!r.email) continue;
      const dedupeKey = `${r.user_id}_${r.id}_${r.time}`;
      if (sentReminders.has(dedupeKey)) continue;
      sentReminders.add(dedupeKey);

      const htmlContent = getReminderEmailHtml(r.habit_name, false);
      await sendEmail({
        to: r.email,
        subject: `LifeTrack Reminder: ${r.habit_name}`,
        text: `Reminder: ${r.habit_name} - Stay consistent with your daily wellness routine!`,
        html: htmlContent,
      });
      console.log(`[Scheduler] Sent daily reminder for "${r.habit_name}" to ${r.email}`);
    }

    // 📅 WEEKLY TASKS
    const [weekly] = await db.query(
      `SELECT w.*, u.email
       FROM weekly_tasks w
       JOIN users u ON w.user_id = u.id
       WHERE (w.day = ? AND w.reminder_time = ?)
          OR (w.day = ? AND w.reminder_time = ?)
          OR (w.day = ? AND w.reminder_time = ?)`,
      [istDay, istTime, utcDay, utcTime, localDay, localTime],
    );

    const sentWeekly = new Set();
    for (let t of weekly) {
      if (!t.email) continue;
      const dedupeKey = `${t.user_id}_${t.id}_${t.reminder_time}`;
      if (sentWeekly.has(dedupeKey)) continue;
      sentWeekly.add(dedupeKey);

      const htmlContent = getReminderEmailHtml(t.name, true);
      await sendEmail({
        to: t.email,
        subject: `LifeTrack Weekly Task: ${t.name}`,
        text: `Weekly Task: ${t.name} - Today is ${t.day}!`,
        html: htmlContent,
      });
      console.log(`[Scheduler] Sent weekly task reminder for "${t.name}" to ${t.email}`);
    }
  } catch (err) {
    console.error("[Scheduler] Error checking reminders:", err);
  }
});

// Every Sunday at 6 PM IST / UTC
cron.schedule("0 18 * * 0", async () => {
  console.log("[Scheduler] Running Sunday weekly auto email report...");

  try {
    const [users] = await db.query("SELECT id, email FROM users");

    for (let user of users) {
      if (!user.email) continue;

      try {
        const pdfBuffer = await generateWeeklyPDF(user.id);

        await sendEmail({
          to: user.email,
          subject: "Your LifeTrack Weekly Wellness Report 📊",
          text: "Attached is your weekly progress report from LifeTrack.",
          attachments: [
            {
              filename: "LifeTrack_Weekly_Report.pdf",
              content: pdfBuffer,
            },
          ],
        });
        console.log(`[Scheduler] Weekly PDF report sent to ${user.email}`);
      } catch (userErr) {
        console.error(`[Scheduler] Failed generating report for user ${user.id}:`, userErr);
      }
    }
  } catch (err) {
    console.error("[Scheduler] Weekly email error:", err);
  }
});
