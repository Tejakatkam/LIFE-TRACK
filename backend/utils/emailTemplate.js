exports.getReminderEmailHtml = (taskName, isWeekly = false) => {
  const formattedTaskName = taskName || "Wellness Habit";
  const smallHeader = isWeekly ? "WEEKLY REMINDER" : "WELLNESS REMINDER";
  const mainTitle = isWeekly ? "Time for your<br/>weekly check-in" : "Time for your<br/>daily ritual";
  const description = isWeekly
    ? "Your weekly reminder is here. A small consistent act is the foundation of lasting change."
    : "Your habit reminder is here. A small consistent act is the foundation of lasting change.";

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
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 540px; margin: 0 auto;">
          
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
            <td align="center" style="background-color: #171412; border: 1px solid #2e2621; border-top: 3px solid #c5a073; border-radius: 18px; padding: 40px 28px 40px 28px; box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);">
              
              <!-- Center Circular Sparkle Icon (Table Centered) -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 20px auto;">
                <tr>
                  <td align="center" valign="middle" width="60" height="60" style="width: 60px; height: 60px; background-color: #211c19; border: 1px solid #3d332c; border-radius: 50%; font-size: 22px; color: #d6b38a; line-height: 60px; text-align: center; vertical-align: middle; mso-line-height-rule: exactly;">
                    ✦
                  </td>
                </tr>
              </table>

              <!-- Pill Badge (Table Centered) -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 16px auto;">
                <tr>
                  <td align="center" valign="middle" style="background-color: #231c17; border: 1px solid #4a3a2d; border-radius: 30px; padding: 6px 18px; text-align: center;">
                    <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #d6b38a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      ⏰ TIME FOR ${formattedTaskName.toUpperCase()}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Small Header -->
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #8e8379; margin-bottom: 12px; font-weight: 600;">
                ${smallHeader}
              </div>

              <!-- Main Heading -->
              <h1 style="margin: 0 0 16px 0; font-family: 'Georgia', serif; font-size: 34px; font-weight: normal; color: #f7f3ec; line-height: 1.2; letter-spacing: 0.5px;">
                ${mainTitle}
              </h1>

              <!-- Subtitle Description -->
              <p style="margin: 0 0 28px 0; font-size: 14px; color: #9c9083; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 90%; margin-left: auto; margin-right: auto;">
                ${description}
              </p>

              <!-- Inner Task Box (Table Centered Icons) -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #211c19; border: 1px solid #2e2621; border-radius: 12px; text-align: left;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="center" valign="middle" width="44" height="44" style="width: 44px; height: 44px; background-color: #2a231f; border-radius: 8px; text-align: center; vertical-align: middle; font-size: 18px; color: #d6b38a; line-height: 44px; mso-line-height-rule: exactly;">
                          ✦
                        </td>
                        <td valign="middle" style="padding-left: 16px;">
                          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #8e8379; margin-bottom: 3px; font-weight: 600;">
                            YOUR TASK
                          </div>
                          <div style="font-size: 20px; font-family: 'Georgia', serif; color: #f7f3ec; margin-bottom: 3px; font-weight: 500;">
                            ${formattedTaskName}
                          </div>
                          <div style="font-size: 13px; color: #9c9083;">
                            Time for your ${formattedTaskName} routine!
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Brand -->
          <tr>
            <td align="center" style="padding-top: 28px;">
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

