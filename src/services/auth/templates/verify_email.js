module.exports = function verifyEmailTemplate({
  code,
  appName = 'Scribo Blog',
  expiresInMinutes = 10
}) {
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Email verification</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f6f6f6;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table width="100%" style="max-width:520px;background:#ffffff;border-radius:8px;padding:24px;font-family:Arial,Helvetica,sans-serif;">
            
            <tr>
              <td style="text-align:center;">
                <h2 style="margin:0 0 12px 0;color:#111;">
                  Confirm your email
                </h2>
              </td>
            </tr>

            <tr>
              <td style="color:#333;font-size:15px;line-height:1.5;">
                <p>Hello 👋</p>

                <p>
                  It’s <b>${appName}</b>.
                  Please confirm your email address using the verification code below:
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:16px 0;">
                <div style="
                  display:inline-block;
                  padding:12px 24px;
                  font-size:24px;
                  letter-spacing:4px;
                  font-weight:bold;
                  background:#f0f2f5;
                  border-radius:6px;
                ">
                  ${code}
                </div>
              </td>
            </tr>

            <tr>
              <td style="color:#333;font-size:14px;line-height:1.5;">
                <p>
                  This code will expire in <b>${expiresInMinutes} minutes</b>.
                </p>

                <p>
                  If you did not request this, you can safely ignore this email.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding-top:24px;border-top:1px solid #eaeaea;color:#777;font-size:12px;">
                <p style="margin:0;">
                  ${appName}<br />
                  This is a transactional email.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`
}