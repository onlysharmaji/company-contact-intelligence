const { google } = require('googleapis');
const cfg = require('../config').google;
const HEADERS = ['Date/Time', 'Company Name', 'Official Website', 'Contact Person Name', 'Designation', 'Department', 'Professional Email', 'Professional Mobile/Phone', 'LinkedIn/Profile URL', 'Contact Page URL', 'Source URL', 'Contact Type', 'Country', 'City', 'Data Confidence', 'Verification Status', 'Notes'];

function client() {
  if (!cfg.sheetId || !cfg.email || !cfg.key) throw new Error('SHEETS_CONFIG');
  // Credentials stay server-side; literal \n in the env value is converted back into newlines.
  const auth = new google.auth.JWT(cfg.email, null, cfg.key.replace(/\\n/g, '\n'), ['https://www.googleapis.com/auth/spreadsheets']);
  return google.sheets({ version: 'v4', auth });
}
// Neutralise spreadsheet formula injection.
const safe = v => (typeof v === 'string' && /^[=\-@]/.test(v) ? "'" + v : v ?? '');

/** Builds dedupe keys (email, phone, name+company) from rows already in the sheet. */
async function existingKeys() {
  const r = await client().spreadsheets.values.get({ spreadsheetId: cfg.sheetId, range: 'A:Q' });
  const rows = r.data.values || [], set = new Set();
  rows.slice(1).forEach(x => { if (x[6]) set.add('e:' + x[6].toLowerCase()); if (x[7]) set.add('p:' + x[7]); if (x[3]) set.add('n:' + (x[3] + '|' + x[1]).toLowerCase()); });
  return { set, empty: rows.length === 0 };
}
const toRow = c => [new Date().toISOString(), c.companyName, c.website, c.name, c.designation, c.department, c.email, c.phone, c.linkedin, c.contactPage, c.sourceUrl, c.contactType, c.country, c.city, c.confidence, c.status, c.notes].map(safe);

async function append(contacts, writeHeader) {
  const values = contacts.map(toRow); if (writeHeader) values.unshift(HEADERS);
  await client().spreadsheets.values.append({ spreadsheetId: cfg.sheetId, range: 'A1', valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS', requestBody: { values } });
}
module.exports = { existingKeys, append };
