const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');

async function main() {
  const token = (process.argv[2] || '').trim();
  const dir = process.cwd();

  if (!token) {
    console.error('❌ Error: GitHub token is missing.');
    process.exit(1);
  }

  console.log('🚀 Pushing project to https://github.com/karthik14288/project-2.git...');

  try {
    const pushResult = await git.push({
      fs,
      http,
      dir,
      remote: 'origin',
      ref: 'main',
      url: 'https://github.com/karthik14288/project-2.git',
      force: true,
      onAuth: () => ({
        username: token,
        password: ''
      })
    });

    console.log('✅ Successfully pushed to GitHub repository!');
    console.log('🔗 Live Repository: https://github.com/karthik14288/project-2');
  } catch (err) {
    console.error('❌ Push error:', err.message || err);
  }
}

main();
