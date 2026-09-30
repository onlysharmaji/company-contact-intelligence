const dns = require('dns').promises;
// Returns a URL object or null for anything that isn't a plausible public http(s) site.
function normalize(input) {
  try {
    const u = new URL(/^https?:\/\//i.test(input) ? input : 'https://' + input);
    return ['http:', 'https:'].includes(u.protocol) && u.hostname.includes('.') ? u : null;
  } catch { return null; }
}
// SSRF protection: refuse hosts resolving to private/loopback ranges.
async function assertPublicHost(host) {
  const { address } = await dns.lookup(host);
  if (/^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1|fc|fd|fe80)/i.test(address)) throw new Error('PRIVATE_HOST');
}
module.exports = { normalize, assertPublicHost };
