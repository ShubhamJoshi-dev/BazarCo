export function getReminderEmailHtml(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BazarCo – Launch reminder</title>
</head>
<body style="margin:0; padding:0; background-color:#0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0a0a0a; min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px; border:1px solid #333;">
          <tr>
            <td style="background-color:#0f0f0f; padding:48px 40px; border-left:2px solid rgba(229,115,115,0.4); border-right:2px solid rgba(100,181,246,0.4);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <p style="margin:0; font-size:28px; font-weight:700;"><span style="color:#e57373;">Bazar</span><span style="color:#64b5f6;">Co</span></p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <p style="margin:0; font-size:20px; font-weight:700; color:#ffffff;">Reminder</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 28px 0; border-bottom:1px solid #333;"></td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:28px;">
                    <p style="margin:0; font-size:16px; line-height:1.7; color:#b0b0b0;">
                      A quick reminder: BazarCo is launching on <strong style="color:#ffffff;">August 20, 2026</strong>. We will notify you on launch day and for major updates.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:28px;">
                    <p style="margin:0; font-size:14px; color:#808080;">Thank you for your interest.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

export function getReminderEmailText(): string {
  return "A quick reminder: BazarCo is launching on August 20, 2026. We will notify you on launch day and for major updates.";
}
