const { Resend } = require("resend");

// Initialize Resend with API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendEmail = async ({ to, subject, text, html, attachments = [] }) => {
  try {
    const { data, error } = await resend.emails.send({
      // Resend free tier requires sending FROM onboarding@resend.dev
      from: "LifeTrack <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      text: text,
      html: html,
      attachments: attachments,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw new Error(error.message);
    }
    
    console.log("Email sent successfully via Resend to", to);
  } catch (err) {
    console.error("Email service error:", err);
    throw err;
  }
};

