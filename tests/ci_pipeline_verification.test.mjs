import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('CI Pipeline — package.json scripts and configuration', () => {
  const pkgPath = path.resolve('package.json');
  assert.ok(fs.existsSync(pkgPath), 'package.json must exist');
  
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  assert.ok(pkg.scripts, 'scripts block must exist');
  assert.ok(pkg.scripts.lint, 'scripts.lint must be configured');
  assert.ok(pkg.scripts.test, 'scripts.test must be configured');
  assert.ok(pkg.scripts.build, 'scripts.build must be configured');
  
  // Verify eslint devDependencies
  assert.ok(pkg.devDependencies.eslint, 'eslint must be in devDependencies');
  assert.ok(pkg.devDependencies['eslint-config-next'], 'eslint-config-next must be in devDependencies');
});

test('CI Pipeline — .github/workflows/ci.yml structure', () => {
  const ciPath = path.resolve('.github/workflows/ci.yml');
  assert.ok(fs.existsSync(ciPath), 'ci.yml must exist');
  
  const ciContent = fs.readFileSync(ciPath, 'utf8');
  assert.ok(ciContent.includes('actions/setup-node'), 'Workflow must use setup-node');
  assert.ok(ciContent.includes("node-version: 20"), 'Workflow must target Node 20 LTS');
});

test('CI Pipeline — .eslintrc.json exists and is valid', () => {
  const eslintPath = path.resolve('.eslintrc.json');
  assert.ok(fs.existsSync(eslintPath), '.eslintrc.json must exist');
  
  const config = JSON.parse(fs.readFileSync(eslintPath, 'utf8'));
  assert.ok(config.extends, 'ESLint config must extend standard configuration');
});

test('CI Pipeline — CONTRIBUTING.md documents CI commands', () => {
  const docPath = path.resolve('CONTRIBUTING.md');
  assert.ok(fs.existsSync(docPath), 'CONTRIBUTING.md must exist');
  
  const doc = fs.readFileSync(docPath, 'utf8');
  assert.ok(doc.includes('npm ci'), 'Must document npm ci');
  assert.ok(doc.includes('npm run lint'), 'Must document npm run lint');
  assert.ok(doc.includes('npm test'), 'Must document npm test');
  assert.ok(doc.includes('npm run build'), 'Must document npm run build');
});
