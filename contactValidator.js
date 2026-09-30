const JUNK = /cookie|privacy|subscribe|login|sign in|menu|read more|learn more|submit|copyright|all rights|terms|newsletter|click here/i;
const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;
const PLACEHOLDER = /(example\.|yourdomain|domain\.com|sentry|wixpress|@2x|\.(png|jpg|svg|gif)$)/i;

const email = e => { const v = (e || '').trim().toLowerCase(); return EMAIL_RE.test(v) && !PLACEHOLDER.test(v) ? v : null; };
function phone(p) {
  if (!p) return null; const digits = p.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) return null;
  return (p.trim().startsWith('+') ? '+' : '') + digits;
}
const name = n => (n && n.length >= 4 && n.length <= 60 && !JUNK.test(n)) ? n.trim() : '';
/** Returns a cleaned contact, or null when no valid email/phone remains. */
function validate(c) {
  const e = email(c.email), p = phone(c.phone);
  if (!e && !p) return null;
  return { ...c, email: e || '', phone: p || '', name: name(c.name), designation: c.designation || '' };
}
module.exports = { validate, email, phone };
