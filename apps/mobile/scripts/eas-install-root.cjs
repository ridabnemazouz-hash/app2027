/* global require, __dirname, process */
/* eslint-disable @typescript-eslint/no-require-imports */
// EAS runs this hook before installing the mobile app. The repository intentionally
// installs shared dependencies at its root without Windows workspace symlinks.
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const result = spawnSync(
  process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['ci', '--no-audit', '--no-fund'],
  {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
