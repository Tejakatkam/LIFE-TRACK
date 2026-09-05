const cron = require("node-cron");
const db = require("../config/db");
const { sendEmail } = require("./emailService");
const { generateWeeklyPDF } = require("./reportGenerator");
const { getReminderEmailHtml } = require("../utils/emailTemplate");

cron.schedule("* * * * *", async () => {
  const now = new Date();

  // 1. Calculate IST (UTC + 5 hours 30 minutes) deterministically with milliseconds
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffsetMs);
  const istHours = String(istDate.getUTCHours()).padStart(2, "0");
  const istMinutes = String(istDate.getUTCMinutes()).padStart(2, "0");
  const istTime = `${istHours}:${istMinutes}`;

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const istDay = days[istDate.getUTCDay()];

  // 2. Calculate UTC
  const utcHours = String(now.getUTCHours()).padStart(2, "0");
  const utcMinutes = String(now.getUTCMinutes()).padStart(2, "0");
  const utcTime = `${utcHours}:${utcMinutes}`;
  const utcDay = days[now.getUTCDay()];

  console.log(`[Scheduler Tick] Checking alarms -> IST: ${istTime} (${istDay}) | UTC: ${utcTime} (${utcDay})`);

  try {
    // 🔔 DAILY REMINDERS (Match either IST or UTC time format e.g. "21:50")
    const [reminders] = await db.query(
      `SELECT r.id, r.user_id, r.habit_name, r.time, u.email, u.username
       FROM reminders r
       INNER JOIN users u ON r.user_id = u.id
       WHERE (TRIM(r.time) = ? OR TRIM(r.time) = ?) AND u.email IS NOT NULL`,
      [istTime, utcTime],
    );

    if (reminders && reminders.length > 0) {
      console.log(`[Scheduler] Found ${reminders.length} reminder(s) to send at ${istTime}`);
    }

    const sentReminders = new Set();
    for (let r of reminders) {
      const userEmail = String(r.email || "").trim().toLowerCase();
      if (!userEmail) continue;

      const dedupeKey = `${r.user_id}_${r.id}_${r.time}`;
      if (sentReminders.has(dedupeKey)) continue;
      sentReminders.add(dedupeKey);

      const htmlContent = getReminderEmailHtml(r.habit_name, false);
      await sendEmail({
        to: userEmail,
        subject: `LifeTrack Reminder: ${r.habit_name}`,
        text: `Reminder: ${r.habit_name} - Stay consistent with your daily wellness routine!`,
        html: htmlContent,
      });
      console.log(`[Scheduler] ✅ Reminder for "${r.habit_name}" sent strictly to ${userEmail} (User: ${r.username || r.user_id})`);
    }

    // 📅 WEEKLY TASKS
    const [weekly] = await db.query(
      `SELECT w.id, w.user_id, w.name, w.day, w.reminder_time, u.email, u.username
       FROM weekly_tasks w
       INNER JOIN users u ON w.user_id = u.id
       WHERE ((TRIM(w.day) = ? AND TRIM(w.reminder_time) = ?)
          OR (TRIM(w.day) = ? AND TRIM(w.reminder_time) = ?)) AND u.email IS NOT NULL`,
      [istDay, istTime, utcDay, utcTime],
    );

    if (weekly && weekly.length > 0) {
      console.log(`[Scheduler] Found ${weekly.length} weekly task(s) to send`);
    }

    const sentWeekly = new Set();
    for (let t of weekly) {
      const userEmail = String(t.email || "").trim().toLowerCase();
      if (!userEmail) continue;

      const dedupeKey = `${t.user_id}_${t.id}_${t.reminder_time}`;
      if (sentWeekly.has(dedupeKey)) continue;
      sentWeekly.add(dedupeKey);

      const htmlContent = getReminderEmailHtml(t.name, true);
      await sendEmail({
        to: userEmail,
        subject: `LifeTrack Weekly Task: ${t.name}`,
        text: `Weekly Task: ${t.name} - Today is ${t.day}!`,
        html: htmlContent,
      });
      console.log(`[Scheduler] ✅ Weekly task reminder for "${t.name}" sent strictly to ${userEmail} (User: ${t.username || t.user_id})`);
    }
  } catch (err) {
    console.error("[Scheduler] Error checking reminders:", err);
  }
});

// Every Sunday at 6 PM IST / UTC
cron.schedule("0 18 * * 0", async () => {
  console.log("[Scheduler] Running Sunday weekly auto email report...");

  try {
    const [users] = await db.query("SELECT id, email, username FROM users WHERE email IS NOT NULL");

    for (let user of users) {
      const userEmail = String(user.email || "").trim().toLowerCase();
      if (!userEmail) continue;

      try {
        const pdfBuffer = await generateWeeklyPDF(user.id);

        await sendEmail({
          to: userEmail,
          subject: "Your LifeTrack Weekly Wellness Report 📊",
          text: `Hello ${user.username || "there"}, attached is your weekly progress report from LifeTrack!`,
          attachments: [
            {
              filename: "LifeTrack - Weekly Report.pdf",
              content: pdfBuffer,
            },
          ],
        });
        console.log(`[Scheduler] Weekly PDF report sent strictly to ${userEmail}`);
      } catch (userErr) {
        console.error(`[Scheduler] Failed generating report for user ${user.id} (${userEmail}):`, userErr);
      }
    }
  } catch (err) {
    console.error("[Scheduler] Weekly email error:", err);
  }
});
