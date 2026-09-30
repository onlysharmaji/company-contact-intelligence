const DESIG = /\b(CEO|CTO|CIO|CFO|COO|Chief [A-Za-z ]+ Officer|Managing Director|Director|Founder|President|Vice President|General Manager|Manager|Head of [A-Za-z ]+|HR [A-Za-z]+|Human Resources[A-Za-z ]*|Recruiter|Talent Acquisition[A-Za-z ]*|Support (Engineer|Executive|Lead)|Technical Support[A-Za-z ]*|Customer (Support|Care)[A-Za-z ]*|System Administrator|Sales[A-Za-z ]*|Executive)\b/i;
const NAME = /^(?:(?:Mr|Ms|Mrs|Dr|Er|Prof)\.?\s+)?[A-Z][a-z]+(?:\s[A-Z]\.?)?(?:\s[A-Z][a-z]+){1,2}$/;
const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const PHONE = /(?:tel|phone|mobile|call|ph)[^\d+]{0,10}(\+?\d[\d\s()-]{7,16}\d)|(\+\d[\d\s()-]{8,16}\d)/gi;

const textLines = ($, el) => $(el).find('*').addBack().contents().filter((_, n) => n.type === 'text')
  .map((_, n) => $(n).text().replace(/\s+/g, ' ').trim()).get().filter(Boolean);
const phonesIn = (s, $, $el) => {
  const p = new Set(); $el.find('a[href^="tel:"]').each((_, a) => p.add($(a).attr('href').slice(4)));
  for (const m of s.matchAll(PHONE)) p.add(m[1] || m[2]); return [...p];
};

/** Extracts raw candidates from one page: named people (name+designation blocks), role mailboxes, public phones. */
function extract({ url, $ }) {
  $('script,style,noscript,nav').remove();
  const out = [], names = new Set(), claimed = new Set();
  $('li,article,div,section,tr,p').each((_, el) => {
    const $el = $(el);
    if ($el.find('li,article,div,section,tr,p').length > 3) return; // skip large containers
    const lines = textLines($, el); if (lines.length < 2 || lines.length > 8) return;
    const name = lines.find(l => NAME.test(l));
    const designation = lines.find(l => l !== name && l.length < 80 && DESIG.test(l));
    if (!name || !designation || names.has(name)) return;
    names.add(name);
    const txt = lines.join('\n');
    const email = ($el.find('a[href^="mailto:"]').attr('href') || '').replace(/^mailto:/i, '').split('?')[0] || (txt.match(EMAIL) || [])[0];
    const phone = phonesIn(txt, $, $el)[0];
    if (email) claimed.add(email.toLowerCase()); if (phone) claimed.add(phone);
    out.push({ name, designation, email, phone, linkedin: $el.find('a[href*="linkedin.com/in"]').attr('href'), sourceUrl: url, contactType: 'Named Person' });
  });
  const emails = new Set(); $('a[href^="mailto:"]').each((_, a) => emails.add($(a).attr('href').replace(/^mailto:/i, '').split('?')[0]));
  ($('body').text().match(EMAIL) || []).forEach(m => emails.add(m));
  emails.forEach(e => { if (!claimed.has(e.toLowerCase())) out.push({ email: e, sourceUrl: url, contactType: 'Role Mailbox' }); });
  phonesIn($('body').text(), $, $('body')).forEach(p => { if (!claimed.has(p)) out.push({ phone: p, sourceUrl: url, contactType: 'Public Business Contact' }); });
  return out;
}
module.exports = { extract };
