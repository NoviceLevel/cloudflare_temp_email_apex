const { execSync } = require('child_process');
const https = require('https');
const fs = require('fs');

// 从环境变量读取 token
const TOKEN = process.env.GH_TOKEN;
const REPO = 'NoviceLevel/cloudflare_temp_email_apex';
const BRANCH = 'main';

function api(method, endpoint, data) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : '';
    const req = https.request({
      hostname: 'api.github.com',
      path: `/repos/${REPO}${endpoint}`,
      method,
      headers: {
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'push-script'
      }
    }, res => {
      let result = '';
      res.on('data', chunk => result += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(result || '{}'));
        } else {
          reject(new Error(`${res.statusCode}: ${result}`));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function push() {
  // 1. 获取变更文件
  console.log('Getting changed files...');
  let files = [];
  try {
    const diff = execSync('git diff --name-only origin/main HEAD', { encoding: 'utf8' });
    files = diff.split('\n').filter(f => f.trim() && fs.existsSync(f));
  } catch (e) {
    const diff = execSync('git diff --name-only HEAD~5 HEAD', { encoding: 'utf8' });
    files = diff.split('\n').filter(f => f.trim() && fs.existsSync(f));
  }


  if (!files.length) {
    console.log('No files to push');
    return;
  }
  console.log('Files:', files);

  // 2. 获取远程分支
  console.log('Getting remote ref...');
  const ref = await api('GET', `/git/refs/heads/${BRANCH}`);
  const baseCommit = await api('GET', `/git/commits/${ref.object.sha}`);
  console.log('Base:', ref.object.sha.substring(0, 7));

  // 3. 上传文件创建 blob
  console.log('Uploading files...');
  const tree = [];
  for (const file of files) {
    const content = fs.readFileSync(file);
    const blob = await api('POST', '/git/blobs', {
      content: content.toString('base64'),
      encoding: 'base64'
    });
    tree.push({ path: file.replace(/\\/g, '/'), mode: '100644', type: 'blob', sha: blob.sha });
    console.log(' -', file);
  }

  // 4. 创建 tree
  console.log('Creating tree...');
  const newTree = await api('POST', '/git/trees', { base_tree: baseCommit.tree.sha, tree });

  // 5. 创建 commit
  const msg = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim() || 'update';
  console.log('Commit:', msg);
  const commit = await api('POST', '/git/commits', {
    message: msg,
    tree: newTree.sha,
    parents: [ref.object.sha]
  });

  // 6. 更新分支
  console.log('Updating ref...');
  await api('PATCH', `/git/refs/heads/${BRANCH}`, { sha: commit.sha, force: true });

  // 7. 同步本地
  execSync('git fetch origin', { stdio: 'pipe' });
  execSync(`git reset --hard origin/${BRANCH}`, { stdio: 'pipe' });

  console.log('Done!', commit.sha.substring(0, 7));
}

push().catch(e => { console.error('Error:', e.message); process.exit(1); });
