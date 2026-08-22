const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

exports.sendEmail = async ({ to, subject, text, html, attachments = [] }) => {
  try {
    await transporter.sendMail({
      from: `"LifeTrack" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
      attachments,
    });
    console.log("Email sent to", to);
  } catch (err) {
    console.error("Email error:", err);
    throw err;
  }
};

