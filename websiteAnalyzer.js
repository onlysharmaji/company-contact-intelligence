const cheerio = require('cheerio');
const robotsParser = require('robots-parser');
const { maxPages, timeoutMs } = require('../config');
const UA = 'CompanyContactBot/1.0 (public business contacts only)';
// Only follow links that look like they lead to contact/people/support pages.
const KEYS = /(contact|about|team|leader|management|people|hr|career|support|help|customer|location|branch|corporate|press|media|investor|director|board)/i;

async function get(url) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), timeoutMs);
  try { return await fetch(url, { headers: { 'User-Agent': UA }, signal: c.signal, redirect: 'follow' }); }
  finally { clearTimeout(t); }
}

/** Breadth-first, same-origin, robots-aware crawl limited to maxPages. Never bypasses 401/403/429. */
async function analyze(start, onPage) {
  const origin = start.origin; let robots = null, blocked = false;
  try { const r = await get(origin + '/robots.txt'); if (r.ok) robots = robotsParser(origin + '/robots.txt', await r.text()); } catch {}
  const queue = [start.href], seen = new Set(), pages = [];
  while (queue.length && pages.length < maxPages) {
    const url = queue.shift(); if (seen.has(url)) continue; seen.add(url);
    if (robots && !robots.isAllowed(url, UA)) { blocked = true; continue; }
    let r; try { r = await get(url); } catch { continue; }
    if ([401, 403, 429].includes(r.status)) { blocked = true; continue; }
    if (!r.ok || !(r.headers.get('content-type') || '').includes('html')) continue;
    const $ = cheerio.load(await r.text()); pages.push({ url, $ }); onPage?.(pages.length);
    $('a[href]').each((_, a) => { try {
      const u = new URL($(a).attr('href'), url); u.hash = '';
      if (u.origin === origin && !/\.(pdf|jpe?g|png|gif|zip|docx?)$/i.test(u.pathname) && KEYS.test(u.pathname + ' ' + $(a).text()) && !seen.has(u.href)) queue.push(u.href);
    } catch {} });
  }
  if (!pages.length) throw new Error(blocked ? 'BLOCKED' : 'UNREACHABLE');
  return pages;
}
module.exports = { analyze };
