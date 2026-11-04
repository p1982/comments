#!/usr/bin/env node

/**
 * Allowed branch names:
 * - main | master | develop
 * - <type>/<ticket?-description>
 *
 * Types: feature | fix | hotfix | release | chore | docs | refactor | test | ci | perf
 * Examples:
 *   feature/auth-login
 *   fix/COM-42-null-check
 *   chore/update-deps
 */

const { execSync } = require('node:child_process');

const ALLOWED =
  /^(main|master|develop)$|^((feature|fix|hotfix|release|chore|docs|refactor|test|ci|perf)\/[a-zA-Z0-9]+(?:[./_-][a-zA-Z0-9]+)*)$/;

function getBranchName() {
  if (process.env.GITHUB_HEAD_REF) {
    return process.env.GITHUB_HEAD_REF;
  }

  try {
    return execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    // Empty repo / no commits yet — read symbolic ref
    try {
      return execSync('git symbolic-ref --short HEAD', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch {
      console.error('Unable to resolve current git branch.');
      process.exit(1);
    }
  }
}

const branch = getBranchName();

if (branch === 'HEAD') {
  // Detached HEAD during rebase/CI checkout — skip
  process.exit(0);
}

if (!ALLOWED.test(branch)) {
  console.error(`
Invalid branch name: "${branch}"

Use one of:
  main | master | develop
  <type>/<kebab-description>
  <type>/<TICKET>-<kebab-description>

Types: feature, fix, hotfix, release, chore, docs, refactor, test, ci, perf

Examples:
  feature/add-comments-api
  fix/COM-12-cors-origin
  chore/bump-deps
`);
  process.exit(1);
}

console.log(`Branch name OK: ${branch}`);
