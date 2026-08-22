exports.getReminderEmailHtml = (taskName, isWeekly = false) => {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 0; background-color: #f7f7f7; }
  .email-container { max-width: 600px; margin: 0 auto; background-color: #12100f; color: #f5f0e6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; }
  .header { text-align: center; font-size: 24px; font-family: Georgia, serif; letter-spacing: 2px; margin-bottom: 40px; color: #f5f0e6; }
  .card { background-color: #1a1715; border: 1px solid #332d29; border-radius: 16px; padding: 40px 30px; text-align: center; }
  .icon-wrap { width: 48px; height: 48px; background-color: #24201d; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #dcb38a; }
  .badge { display: inline-block; border: 1px solid #dcb38a; border-radius: 20px; padding: 4px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #dcb38a; margin-bottom: 20px; }
  .small-title { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #8e8379; margin-bottom: 10px; }
  .main-title { font-size: 32px; font-family: Georgia, serif; margin: 0 0 20px 0; color: #f5f0e6; }
  .desc { font-size: 14px; color: #a1968d; line-height: 1.6; margin-bottom: 30px; max-width: 80%; margin-left: auto; margin-right: auto; }
  .task-box { background-color: #24201d; border-radius: 12px; padding: 20px; margin-bottom: 30px; text-align: left; display: flex; align-items: center; gap: 15px; }
  .task-icon { background-color: #2f2a26; width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #dcb38a; }
  .task-info-title { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #8e8379; margin: 0 0 4px 0; }
  .task-name { font-size: 18px; margin: 0 0 4px 0; color: #f5f0e6; font-family: Georgia, serif; }
  .task-sub { font-size: 12px; color: #a1968d; margin: 0; }
  .btn { display: inline-block; background-color: #dcb38a; color: #12100f; text-decoration: none; padding: 14px 32px; border-radius: 30px; font-size: 12px; font-weight: bold; letter-spacing: 1px; margin-bottom: 15px; }
  .app-link { color: #8e8379; font-size: 12px; text-decoration: underline; }
  .quote-wrap { margin-top: 40px; border-top: 1px solid #332d29; padding-top: 30px; }
  .quote-text { font-family: Georgia, serif; font-size: 16px; color: #8e8379; font-style: italic; line-height: 1.5; margin: 0 0 15px 0; }
  .quote-author { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #665b53; margin: 0; }
  .footer { text-align: center; margin-top: 40px; }
  .footer-logo { font-family: Georgia, serif; font-size: 16px; color: #8e8379; margin-bottom: 10px; }
  .footer-text { font-size: 11px; color: #554b44; }
</style>
</head>
<body>
<div style="background-color: #f7f7f7; padding: 20px 0;">
  <div class="email-container">
    <div class="header">life&middot;track</div>
    
    <div class="card">
      <div class="icon-wrap">✦</div>
      <div class="badge">⏰ TIME FOR ${taskName.toUpperCase()}</div>
      
      <div class="small-title">${isWeekly ? "WEEKLY REMINDER" : "WELLNESS REMINDER"}</div>
      <h1 class="main-title">Time for your<br/>${isWeekly ? "weekly check-in" : "daily ritual"}</h1>
      
      <p class="desc">Your habit reminder is here. A small consistent act is the foundation of lasting change.</p>
      
      <div class="task-box">
        <div class="task-icon">✦</div>
        <div>
          <p class="task-info-title">YOUR TASK</p>
          <h2 class="task-name">${taskName}</h2>
          <p class="task-sub">Time for your ${taskName} routine!</p>
        </div>
      </div>
      
      <a href="https://lifetrack.app" class="btn">MARK AS DONE</a>
      <br/>
      <a href="https://lifetrack.app" class="app-link">or open app to log your progress</a>
      
      <div class="quote-wrap">
        <p class="quote-text">"We are what we repeatedly do. Excellence, then, is not an act, but a habit."</p>
        <p class="quote-author">&mdash; ARISTOTLE</p>
      </div>
    </div>

    <div class="footer">
      <div class="footer-logo">life&middot;track</div>
      <div class="footer-text">
        You are receiving this because you set a reminder in LifeTrack.<br/>
        &copy; 2026 LifeTrack &mdash; Made with care for your wellness journey
      </div>
    </div>
  </div>
</div>
</body>
</html>
  `;
};

