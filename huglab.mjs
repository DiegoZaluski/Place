#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LLAMA_PATH = join(__dirname, 'llama.cpp');

// Check and clone llama.cpp if needed
if (!existsSync(LLAMA_PATH)) {
  console.log('Cloning llama.cpp...');
  const clone = spawn('git', ['clone', '--depth', '1', '--branch', 'master', 'https://github.com/ggerganov/llama.cpp.git', 'llama.cpp'], {
    stdio: 'inherit',
    shell: true
  });

  await new Promise((resolve, reject) => {
    clone.on('close', (code) => {
      if (code === 0) {
        console.log('✓ llama.cpp cloned\n');
        resolve();
      } else {
        reject(new Error('Failed to clone llama.cpp'));
      }
    });
  });
}

console.log('\x1b[32m[Starting dev server]\x1b[m');

// Start Vite in background
const vite = spawn('npm', ['run', 'dev'], {
  stdio: 'ignore',
  shell: true,
  detached: true
});

// Wait for Vite to be ready
setTimeout(() => {
  // Start Electron and show its output
  const electron = spawn('npm', ['start'], {
    stdio: 'inherit',
    shell: true
  });

  electron.on('close', () => {
    vite.kill();
    process.exit(0);
  });
}, 3000);

// Cleanup on exit
process.on('SIGINT', () => {
  vite.kill();
  process.exit(0);
});