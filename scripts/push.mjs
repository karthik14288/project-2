import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node/index.js';
import fs from 'fs';
import readline from 'readline';

async function promptToken() {
  const tokenArg = process.argv[2];
  if (tokenArg) return tokenArg.trim();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('🔑 Enter your GitHub Personal Access Token (or fine-grained PAT): ', (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

async function main() {
  const dir = process.cwd();
  const token = await promptToken();

  if (!token) {
    console.error('❌ Error: GitHub token is required to push to GitHub.');
    process.exit(1);
  }

  console.log('🚀 Pushing project to https://github.com/karthik14288/project-2.git on branch main...');

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
    console.log('🔗 Repository URL: https://github.com/karthik14288/project-2');
  } catch (err) {
    console.error('❌ Push failed:', err.message || err);
    console.error('\n💡 Note: Ensure your Personal Access Token has "repo" / "Contents: Read & Write" permissions.');
  }
}

main();
