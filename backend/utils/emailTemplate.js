exports.getReminderEmailHtml = (taskName, isWeekly = false) => {
  const formattedTaskName = taskName || "Wellness Habit";
  const badgeText = isWeekly
    ? `📋 WEEKLY TASK: ${formattedTaskName.toUpperCase()}`
    : `⏰ TIME FOR ${formattedTaskName.toUpperCase()}`;
  const subLine = isWeekly
    ? `Time for your scheduled weekly check-in!`
    : `Time for your ${formattedTaskName} routine!`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LifeTrack Reminder</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0d0b0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0d0b0a; min-height: 100vh; padding: 40px 15px;">
    <tr>
      <td align="center" valign="top">
        
        <!-- Max Width Wrapper -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; margin: 0 auto;">
          
          <!-- Top Header Brand -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <div style="font-family: 'Georgia', serif; font-size: 26px; color: #ede6dc; letter-spacing: 3px; font-weight: normal; margin-bottom: 8px;">
                life&middot;track
              </div>
              <div style="width: 44px; height: 1.5px; background-color: #a6845d; margin: 0 auto;"></div>
            </td>
          </tr>

          <!-- Main Luxury Card -->
          <tr>
            <td align="center" style="background-color: #171412; border: 1px solid #2e2621; border-top: 3px solid #c5a073; border-radius: 18px; padding: 48px 32px 52px 32px; box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);">
              
              <!-- Center Sparkle Icon -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 24px auto;">
                <tr>
                  <td align="center" valign="middle" style="width: 64px; height: 64px; background-color: #211c19; border: 1px solid #3d332c; border-radius: 50%; font-size: 24px; color: #d6b38a; line-height: 1;">
                    ✦
                  </td>
                </tr>
              </table>

              <!-- Pill Badge -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 22px auto;">
                <tr>
                  <td align="center" style="background-color: #231c17; border: 1px solid #4a3a2d; border-radius: 30px; padding: 6px 18px;">
                    <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #d6b38a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Main Heading -->
              <h1 style="margin: 0 0 12px 0; font-family: 'Georgia', serif; font-size: 32px; font-weight: normal; color: #f7f3ec; line-height: 1.25; letter-spacing: 0.5px;">
                Your Task: ${formattedTaskName}
              </h1>

              <!-- Subtitle Description -->
              <p style="margin: 0; font-size: 15px; color: #9c9083; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; letter-spacing: 0.2px;">
                ${subLine}
              </p>

            </td>
          </tr>

          <!-- Footer Brand -->
          <tr>
            <td align="center" style="padding-top: 32px;">
              <div style="font-family: 'Georgia', serif; font-size: 15px; color: #6e6358; letter-spacing: 2px;">
                life&middot;track
              </div>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
};

