const { Resend } = require("resend");

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is missing on server");
  }
  return new Resend(apiKey);
};

exports.sendEmail = async ({ to, subject, text, html, attachments = [] }) => {
  try {
    const resend = getResendClient();
    
    // Format attachments for Resend if provided
    const formattedAttachments = Array.isArray(attachments)
      ? attachments.map((att) => ({
          filename: att.filename,
          content: att.content,
        }))
      : [];

    const payload = {
      from: process.env.RESEND_FROM || "LifeTrack <onboarding@resend.dev>",
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      text: text,
      html: html,
    };

    if (formattedAttachments.length > 0) {
      payload.attachments = formattedAttachments;
    }

    const { data, error } = await resend.emails.send(payload);

    if (error) {
      console.error("Resend API error:", error);
      throw new Error(error.message || "Failed to send email via Resend");
    }

    console.log("Email sent successfully via Resend to", to);
    return data;
  } catch (err) {
    console.error("Email service error:", err);
    throw err;
  }
};

