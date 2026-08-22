const nodemailer = require("nodemailer");
const dns = require("dns");

// Force Node.js to prefer IPv4 over IPv6 for all network requests.
// This prevents ENETUNREACH errors on platforms like Render that 
// have broken/disabled outbound IPv6 routing.
dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  family: 4, // Force IPv4 to prevent ENETUNREACH on Render's IPv6
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

