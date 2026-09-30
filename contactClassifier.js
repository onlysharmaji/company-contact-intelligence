// Rule-based department classification. Designation wins over email local-part when both exist.
const RULES = [
  ['HR', /\b(hr|human resources?|recruit\w*|talent|careers?|hiring)\b/i],
  ['Technical Support', /technical support|tech ?support|support engineer|system admin\w*/i],
  ['IT Support', /\bIT\b/],
  ['Customer Support', /customer (support|care)|help ?desk|\bsupport\b|\bhelp\b/i],
  ['Sales', /sales|business development/i],
  ['Management', /\b(ceo|cto|cio|cfo|coo|chief|director|founder|president|general manager|management)\b/i],
  ['Finance', /finance|accounts?|billing/i],
  ['Marketing', /marketing|media|press/i],
  ['Administration', /admin\w*|\binfo\b|office|contact|enquir\w*|inquir\w*/i],
];
function classify(designation = '', email = '') {
  const local = email.split('@')[0].replace(/[._-]/g, ' ');
  for (const src of [designation, local === 'it' ? 'IT' : local]) {
    if (!src) continue; for (const [dept, re] of RULES) if (re.test(src)) return dept;
  }
  return 'Other';
}
function confidence(c) {
  if (c.name && c.designation && (c.email || c.phone)) return 'High';
  return (c.email || c.phone) && (c.name || c.designation || c.contactType === 'Role Mailbox') ? 'Medium' : 'Low';
}
function status(c) {
  const p = new URL(c.sourceUrl).pathname;
  if (c.confidence === 'Low') return 'Needs Manual Verification';
  if (/team|leader|management|people|director|board/i.test(p)) return 'Found on Official Team Page';
  if (/contact/i.test(p)) return 'Found on Official Contact Page';
  if (/career|job/i.test(p)) return 'Found on Official Careers Page';
  return 'Verified from Official Website';
}
module.exports = { classify, confidence, status };
