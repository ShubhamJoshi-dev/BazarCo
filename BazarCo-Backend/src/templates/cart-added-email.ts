export function getCartAddedEmailHtml(productName: string, quantity: number): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BazarCo – Added to cart</title>
</head>
<body style="margin:0; padding:0; background-color:#0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0a0a0a; min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px; border:1px solid #333; border-radius:12px;">
          <tr>
            <td style="background-color:#0f0f0f; padding:40px; border-radius:12px;">
              <p style="margin:0 0 24px 0; font-size:24px; font-weight:700;">
                <span style="color:#e57373;">Bazar</span><span style="color:#64b5f6;">Co</span>
              </p>
              <p style="margin:0 0 12px 0; font-size:18px; font-weight:600; color:#ffffff;">Added to cart</p>
              <p style="margin:0; font-size:16px; line-height:1.6; color:#b0b0b0;">
                <strong style="color:#fff;">${productName.replace(/</g, "&lt;")}</strong> (qty: ${quantity}) has been added to your cart. Visit your cart to review or checkout.
              </p>
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

export function getCartAddedEmailText(productName: string, quantity: number): string {
  return `Added to cart: ${productName} (qty: ${quantity}). Visit your cart to review or checkout.`;
}
