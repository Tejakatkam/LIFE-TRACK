const nodemailer = require("nodemailer");

module.exports = async (req, res) => {
  // Enable CORS so backend can call it from any domain
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({
      status: "active",
      message: "LifeTrack Email API is ready. Send a POST request to dispatch emails.",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Please use POST." });
  }

  const { secretKey, to, subject, text, html, attachments } = req.body || {};

  // Optional security: Validate secret key if configured
  if (process.env.MAIL_SECRET && secretKey !== process.env.MAIL_SECRET) {
    return res.status(401).json({ error: "Unauthorized: Invalid mail secret key" });
  }

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    return res.status(500).json({
      error: "Vercel environment variables missing EMAIL_USER or EMAIL_PASS",
    });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"LifeTrack" <${emailUser}>`,
      to,
      subject,
      text,
      html,
      attachments,
    });

    console.log("Email sent successfully to:", to);
    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("Vercel mailer error:", error);
    return res.status(500).json({ error: error.message || "Failed to send email" });
  }
};
