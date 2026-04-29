function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getAppUrl() {
  return process.env.APP_URL || 'https://animephile.vercel.app';
}

export function episodeNotificationEmail({ animeTitle, item }) {
  const title = animeTitle;
  const imageUrl =
    item?.images?.webp?.large_image_url ||
    item?.images?.jpg?.large_image_url ||
    null;
  const broadcast = item?.broadcast?.string || 'See MyAnimeList for schedule';
  const episodes = item?.episodes ?? '—';
  const malUrl = item?.url || (item?.mal_id ? `https://myanimelist.net/anime/${item.mal_id}` : '#');
  const appUrl = getAppUrl();

  const subject = `New episode: ${title}`;

  const text = [
    `ANIMEPHILE — A new episode is here`,
    ``,
    title,
    ``,
    `A new episode airs today.`,
    ``,
    `Broadcast: ${broadcast}`,
    `Episodes: ${episodes}`,
    ``,
    `View on MyAnimeList: ${malUrl}`,
    ``,
    `---`,
    `Sent because you follow ${title}.`,
    `Manage your preferences: ${appUrl}/profile`,
  ].join('\n');

  const imageRow = imageUrl
    ? `
          <tr>
            <td style="padding: 0;">
              <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" width="600" style="display: block; width: 100%; max-width: 600px; height: auto;" />
            </td>
          </tr>`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>${escapeHtml(subject)}</title></head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 24px 0;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background-color: #250F22; color: #ffffff; padding: 20px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; letter-spacing: 0.05em;">ANIMEPHILE</h1>
              <p style="margin: 4px 0 0; font-size: 13px; color: #b9aab7;">A new episode is here</p>
            </td>
          </tr>${imageRow}
          <tr>
            <td style="padding: 24px;">
              <h2 style="margin: 0 0 12px; font-size: 20px; color: #1a0d18;">${escapeHtml(title)}</h2>
              <p style="margin: 0 0 12px; color: #444; line-height: 1.5;">A new episode airs today.</p>
              <p style="margin: 0 0 6px; color: #666; font-size: 14px;"><strong>Broadcast:</strong> ${escapeHtml(broadcast)}</p>
              <p style="margin: 0 0 18px; color: #666; font-size: 14px;"><strong>Episodes:</strong> ${escapeHtml(String(episodes))}</p>
              <a href="${escapeHtml(malUrl)}" style="display: inline-block; background-color: #88d317; color: #1a0d18; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: 700;">View on MyAnimeList</a>
            </td>
          </tr>
          <tr>
            <td style="background-color: #faf7fa; padding: 16px 24px; color: #888; font-size: 12px; text-align: center;">
              Sent because you follow <strong>${escapeHtml(title)}</strong>.<br />
              <a href="${escapeHtml(appUrl)}/profile" style="color: #5a3357;">Manage your preferences</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}
