const { execSync } = require('child_process');
const https = require('https');

const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (!token) {
  console.error('Please set GH_TOKEN or GITHUB_TOKEN environment variable');
  process.exit(1);
}
const repo = 'NoviceLevel/cloudflare_temp_email_apex';
const branch = 'main';

const commitSha = execSync('git rev-parse HEAD').toString().trim();
console.log('Pushing commit:', commitSha);

const data = JSON.stringify({ sha: commitSha, force: true });

const options = {
  hostname: 'api.github.com',
  path: `/repos/${repo}/git/refs/heads/${branch}`,
  method: 'PATCH',
  headers: {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'Node.js',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('Done! Pushed to', branch);
    } else {
      console.log('Failed:', res.statusCode, body);
    }
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();
