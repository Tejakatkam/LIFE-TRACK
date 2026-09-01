const { generateWeeklyPDF } = require("../services/reportGenerator");
const { sendEmail } = require("../services/emailService");
const db = require("../config/db");

exports.generateWeeklyReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { trackData = {}, allHabits = [] } = req.body || {};
    const pdfBuffer = await generateWeeklyPDF(userId, trackData, allHabits);

    res.setHeader("Content-Disposition", 'attachment; filename="LifeTrack - Weekly Report.pdf"');
    res.setHeader("Content-Type", "application/pdf");
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Report error" });
  }
};

exports.sendWeeklyReportEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { trackData = {}, allHabits = [] } = req.body || {};

    const [users] = await db.query("SELECT email, username FROM users WHERE id = ?", [userId]);
    if (!users.length || !users[0].email) {
      return res.status(400).json({ message: "User email not found" });
    }

    const userEmail = users[0].email;
    const pdfBuffer = await generateWeeklyPDF(userId, trackData, allHabits);

    await sendEmail({
      to: userEmail,
      subject: "Your LifeTrack Weekly Wellness Report 📊",
      text: `Hello ${users[0].username || "there"}, attached is your weekly progress report from LifeTrack!`,
      attachments: [
        {
          filename: "LifeTrack - Weekly Report.pdf",
          content: pdfBuffer,
        },
      ],
    });

    res.json({ message: `Weekly report sent to ${userEmail}` });
  } catch (err) {
    console.error("sendWeeklyReportEmail error:", err);
    res.status(500).json({ message: `Failed to email report: ${err.message}` });
  }
};
