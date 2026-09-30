// Keys: email, phone, name+company.
const keys = (c) => [
  c.email && 'e:' + c.email.toLowerCase(), c.phone && 'p:' + c.phone,
  c.name && 'n:' + (c.name + '|' + (c.companyName || '')).toLowerCase(),
].filter(Boolean);

/** Splits into unique contacts and duplicates, optionally against a pre-existing key set (e.g. from the sheet). */
function partition(contacts, existing = new Set()) {
  const seen = new Set(existing), fresh = [], dupes = [];
  for (const c of contacts) {
    const k = keys(c);
    if (k.some(x => seen.has(x))) { dupes.push(c); continue; }
    k.forEach(x => seen.add(x)); fresh.push(c);
  }
  return { fresh, dupes };
}
module.exports = { partition, keys };
