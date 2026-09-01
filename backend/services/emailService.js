const { Resend } = require("resend");
const nodemailer = require("nodemailer");

exports.sendEmail = async ({ to, subject, text, html, attachments = [] }) => {
  try {
    const mailServiceUrl = process.env.MAIL_SERVICE_URL;

    // 1. If Vercel Microservice URL is configured, use it (bypasses Render SMTP block)
    if (mailServiceUrl) {
      const formattedAttachments = Array.isArray(attachments)
        ? attachments.map((att) => ({
            filename: att.filename,
            content: Buffer.isBuffer(att.content)
              ? att.content.toString("base64")
              : att.content,
            encoding: Buffer.isBuffer(att.content) ? "base64" : undefined,
            contentType: att.contentType,
          }))
        : [];

      const response = await fetch(mailServiceUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject,
          text,
          html,
          attachments: formattedAttachments,
          secretKey: process.env.MAIL_SECRET,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to send email via Mail Service");
      }

      console.log("Email sent successfully via Vercel Mail Service to:", to);
      return result;
    }

    // 2. Fallback to Resend API if RESEND_API_KEY is configured
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM || "LifeTrack <onboarding@resend.dev>",
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        text: text,
        html: html,
        attachments: Array.isArray(attachments)
          ? attachments.map((att) => ({
              filename: att.filename,
              content: att.content,
            }))
          : [],
      });

      if (error) {
        throw new Error(error.message || "Resend API error");
      }

      console.log("Email sent successfully via Resend to:", to);
      return data;
    }

    // 3. Fallback to direct Nodemailer if running locally with EMAIL_USER and EMAIL_PASS
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: `"LifeTrack" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
        attachments,
      });

      console.log("Email sent directly via Nodemailer to:", to);
      return info;
    }

    throw new Error(
      "No email provider configured. Please set MAIL_SERVICE_URL, RESEND_API_KEY, or EMAIL_USER/EMAIL_PASS."
    );
  } catch (err) {
    console.error("Email service error:", err);
    throw err;
  }
};

