const { normalize, assertPublicHost } = require('../utils/url');
const { analyze } = require('../services/websiteAnalyzer');
const { extract } = require('../services/contactExtractor');
const { classify, confidence, status } = require('../services/contactClassifier');
const { validate } = require('../services/contactValidator');
const { partition } = require('../services/duplicateChecker');
const sheets = require('../services/googleSheets');
const { maxPages } = require('../config');

const MSG = {
  INVALID_URL: 'Please enter a valid company website URL.',
  PRIVATE_HOST: 'Please enter a valid company website URL.',
  UNREACHABLE: 'Unable to access this website. Please check the URL or try again later.',
  BLOCKED: 'Automated access is not permitted by this website. Please use the website manually.',
  NO_CONTACTS: 'No publicly available professional contact information was found.',
};
const fail = e => MSG[e.message] || (e.code === 'ENOTFOUND' ? MSG.UNREACHABLE : e.code === 429 ? 'Request limit reached. Please try again later.' : 'Google Sheets connection failed. Please check the configuration.');

/** POST /api/analyze — streams NDJSON: {type:'progress'} lines, then one {type:'result'} or {type:'error'}. */
exports.analyze = async (req, res) => {
  res.setHeader('Content-Type', 'application/x-ndjson');
  const send = o => res.write(JSON.stringify(o) + '\n');
  const step = (n, label) => send({ type: 'progress', pct: Math.round(n / 11 * 100), label });
  try {
    step(1, 'Validating website');
    const url = normalize(String(req.body.website || '')); if (!url) throw new Error('INVALID_URL');
    await assertPublicHost(url.hostname);
    step(2, 'Connecting to website'); step(3, 'Discovering relevant pages');
    const pages = await analyze(url, n => send({ type: 'progress', pct: 27, label: `Analyzing page ${n} (max ${maxPages})` }));
    step(4, 'Analyzing company information');
    const $0 = pages[0].$;
    const companyName = ($0('meta[property="og:site_name"]').attr('content') || $0('title').text().split(/[|\-–]/)[0] || url.hostname).trim();
    step(5, 'Finding management contacts'); step(6, 'Finding HR contacts'); step(7, 'Finding technical/support contacts');
    const raw = pages.flatMap(extract);
    step(8, 'Validating contact information');
    const cleaned = raw.map(validate).filter(Boolean).map(c => {
      const d = { ...c, companyName, website: url.origin, department: classify(c.designation, c.email), contactPage: c.sourceUrl };
      d.confidence = confidence(d); d.status = status(d); return d;
    });
    step(9, 'Removing duplicates');
    const { fresh } = partition(cleaned);
    if (!fresh.length) throw new Error('NO_CONTACTS');
    step(10, 'Preparing results'); step(11, 'Analysis completed');
    send({ type: 'result', companyName, website: url.origin, pagesAnalyzed: pages.length, contactsFound: fresh.length, contacts: fresh });
  } catch (e) { console.error('[analyze]', e.message); send({ type: 'error', message: fail(e) }); }
  res.end();
};

const sanitize = list => (Array.isArray(list) ? list : []).slice(0, 500).map(validate).filter(Boolean);

/** POST /api/check-duplicates — preview counts against the sheet before saving. */
exports.check = async (req, res) => {
  try {
    const { set } = await sheets.existingKeys(), list = sanitize(req.body.contacts);
    const { fresh, dupes } = partition(list, set);
    res.json({ total: list.length, new: fresh.length, duplicates: dupes.length });
  } catch (e) { console.error('[check]', e.message); res.status(500).json({ error: fail(e) }); }
};

/** POST /api/save-to-sheet — server re-validates and re-checks duplicates; the client is never trusted. */
exports.save = async (req, res) => {
  try {
    const { set, empty } = await sheets.existingKeys();
    const { fresh, dupes } = partition(sanitize(req.body.contacts), set);
    if (fresh.length) await sheets.append(fresh, empty);
    res.json({ success: true, saved: fresh.length, duplicates: dupes.length });
  } catch (e) { console.error('[save]', e.message); res.status(500).json({ success: false, error: fail(e) }); }
};
