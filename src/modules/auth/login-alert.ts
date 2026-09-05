function escapeHtml(value: unknown) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function row(label: string, value: unknown) {
    return `
      <tr>
        <td style="padding:8px 0;color:#787774;font-size:13px;width:120px;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:8px 0;color:#111;font-size:14px;">${escapeHtml(value || '—')}</td>
      </tr>
    `;
}

export function loginAlertTemplate({
    nickName,
    device,
    location,
    ip,
    time,
    settingsUrl,
}: {
    nickName?: string | null;
    device?: string;
    location?: string;
    ip?: string;
    time: string;
    settingsUrl?: string;
}) {
    const button = settingsUrl
        ? `<tr>
              <td align="center" style="padding-top:20px;">
                <a href="${escapeHtml(settingsUrl)}" style="display:inline-block;padding:10px 16px;background:#191919;color:#ffffff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:500;">
                  Открыть сеансы
                </a>
              </td>
            </tr>`
        : '';

    return `
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <title>Новый вход в аккаунт</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f6f6f6;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table width="100%" style="max-width:520px;background:#ffffff;border-radius:8px;padding:24px;font-family:Arial,Helvetica,sans-serif;">
            <tr>
              <td>
                <h2 style="margin:0 0 12px 0;color:#111;">Новый вход в аккаунт</h2>
                <p style="color:#333;font-size:15px;line-height:1.5;margin:0 0 16px 0;">
                  ${escapeHtml(nickName || 'Здравствуйте')}, только что выполнен вход в ваш аккаунт Scribo.
                  Если это были не вы, завершите сеанс в настройках и смените пароль.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
                  ${row('Когда', time)}
                  ${row('Где', location)}
                  ${row('Устройство', device)}
                  ${row('IP', ip)}
                </table>
              </td>
            </tr>
            ${button}
            <tr>
              <td style="padding-top:24px;border-top:1px solid #eaeaea;color:#777;font-size:12px;">
                <p style="margin:0;">Scribo Blog<br/>Это письмо отправлено автоматически при каждом новом входе.</p>
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
