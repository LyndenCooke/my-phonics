// Thin launcher: starts Vite dev server from the parent myphonicsbooks directory
const { execSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const port = process.env.PORT || 5176;

process.chdir(root);
execSync(`node node_modules/vite/bin/vite.js --port ${port}`, {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, PORT: String(port) },
});
