export function getPasswordResetEmailHtml(resetLink: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BazarCo – Reset password</title>
</head>
<body style="margin:0; padding:0; background-color:#0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0a0a0a; min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
          <tr>
            <td style="background-color:#0f0f0f; padding:48px 40px; border-radius:12px;">
              <p style="margin:0 0 24px 0; font-size:24px; font-weight:700;">
                <span style="color:#e57373;">Bazar</span><span style="color:#64b5f6;">Co</span>
              </p>
              <p style="margin:0 0 16px 0; font-size:16px; color:#b0b0b0;">Reset your password</p>
              <p style="margin:0 0 24px 0; font-size:14px; color:#888;">Click the button below to set a new password. This link expires in 1 hour.</p>
              <a href="${resetLink}" style="display:inline-block; background:#64b5f6; color:#0a0a0a; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600;">Reset password</a>
              <p style="margin:24px 0 0 0; font-size:12px; color:#666;">If you did not request this, you can ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

export function getPasswordResetEmailText(resetLink: string): string {
  return `BazarCo – Reset your password: ${resetLink}. This link expires in 1 hour. If you did not request this, ignore this email.`;
}
