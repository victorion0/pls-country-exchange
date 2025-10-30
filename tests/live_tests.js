const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
let passed = 0;
let failed = 0;

function ok(name) { console.log(`✔ ${name}`); passed++; }
function fail(name, err) { console.error(`✖ ${name} — ${err}`); failed++; }

async function run() {
  console.log(`Running live tests against ${BASE}`);

  // 1) POST /countries/refresh
  try {
    const r = await axios.post(`${BASE}/countries/refresh`, {}, { timeout: 60000 });
    if (r.status === 200 && r.data && r.data.success) ok('POST /countries/refresh');
    else fail('POST /countries/refresh', 'unexpected response');
  } catch (err) { fail('POST /countries/refresh', err.message || err); }

  // 2) GET /status
  let statusResp;
  try {
    statusResp = await axios.get(`${BASE}/status`);
    if (statusResp.status === 200 && typeof statusResp.data.total_countries === 'number') ok('GET /status');
    else fail('GET /status', 'bad payload');
  } catch (err) { fail('GET /status', err.message || err); }

  // 3) GET /countries
  let countriesResp;
  try {
    countriesResp = await axios.get(`${BASE}/countries`);
    if (countriesResp.status === 200 && Array.isArray(countriesResp.data) && countriesResp.data.length > 0) ok('GET /countries');
    else fail('GET /countries', 'expected non-empty array');
  } catch (err) { fail('GET /countries', err.message || err); }

  // 4) Filters & sort simple checks
  try {
    const r1 = await axios.get(`${BASE}/countries?region=Africa`);
    if (r1.status === 200) ok('GET /countries?region=Africa'); else fail('GET region', 'bad status');
  } catch (err) { fail('GET region', err.message || err); }

  try {
    const r2 = await axios.get(`${BASE}/countries?currency=USD`);
    if (r2.status === 200) ok('GET /countries?currency=USD'); else fail('GET currency', 'bad status');
  } catch (err) { fail('GET currency', err.message || err); }

  try {
    const r3 = await axios.get(`${BASE}/countries?sort=gdp_desc`);
    if (r3.status === 200 && Array.isArray(r3.data)) ok('GET /countries?sort=gdp_desc'); else fail('GET sort', 'bad payload');
  } catch (err) { fail('GET sort', err.message || err); }

  // 5) GET /countries/:name
  let sampleName;
  try {
    sampleName = countriesResp.data[0].name;
    const one = await axios.get(`${BASE}/countries/${encodeURIComponent(sampleName)}`);
    if (one.status === 200 && one.data && one.data.name) ok('GET /countries/:name'); else fail('GET single', 'bad payload');
  } catch (err) { fail('GET single', err.message || err); }

  // 6) GET /countries/image
  try {
    const img = await axios.get(`${BASE}/countries/image`, { responseType: 'arraybuffer' });
    if (img.status === 200 && img.headers['content-type'] && img.data && img.data.length > 0) {
      // save temporary
      const out = path.join(__dirname, 'summary.png');
      fs.writeFileSync(out, Buffer.from(img.data));
      ok('GET /countries/image');
    } else fail('GET image', 'bad image response');
  } catch (err) { fail('GET image', err.message || err); }

  // 7) DELETE /countries/:name (destructive test) — only run if ALLOW_DELETE=1
  if (process.env.ALLOW_DELETE === '1') {
    try {
      const del = await axios.delete(`${BASE}/countries/${encodeURIComponent(sampleName)}`);
      if (del.status === 200 && del.data && del.data.success) ok('DELETE /countries/:name'); else fail('DELETE', 'unexpected response');
    } catch (err) { fail('DELETE', err.message || err); }

    // restore by running refresh again
    try {
      await axios.post(`${BASE}/countries/refresh`, {}, { timeout: 60000 });
      ok('Restore after DELETE');
    } catch (err) { fail('Restore', err.message || err); }
  } else {
    console.log('Skipping DELETE test (set ALLOW_DELETE=1 to enable)');
  }

  // Summary
  console.log('---');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  if (failed > 0) process.exit(2); else process.exit(0);
}

run();
