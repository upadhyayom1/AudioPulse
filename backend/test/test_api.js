/**
 * API integration test for server and audio endpoints.
 */

const http = require('http');
require('dotenv').config();

const PORT = parseInt(process.env.PORT || '5001', 10);

async function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: body ? JSON.parse(body) : body });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log(`Testing GET http://localhost:${PORT}/api/health...`);
  const healthRes = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/health',
    method: 'GET'
  });
  console.log('Health check response:', healthRes);
  if (healthRes.status !== 200 || healthRes.body.status !== 'ok') {
    throw new Error('Health check failed');
  }

  console.log(`\nTesting POST http://localhost:${PORT}/api/audio/trim with missing URL...`);
  const missingUrlRes = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/audio/trim',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { start: '00:10', end: '00:20' });
  console.log('Missing URL response:', missingUrlRes);
  if (missingUrlRes.status !== 400) {
    throw new Error('Expected 400 for missing URL');
  }

  console.log(`\nTesting POST http://localhost:${PORT}/api/audio/trim with invalid timestamp order (end < start)...`);
  const invalidRangeRes = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/audio/trim',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', start: '00:30', end: '00:10' });
  console.log('Invalid range response:', invalidRangeRes);
  if (invalidRangeRes.status !== 400) {
    throw new Error('Expected 400 for invalid range');
  }

  console.log('\nAll API validation checks passed!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
