#!/usr/bin/env node
/**
 * @felipemadson/envdoctor — Universal CLI
 * Author: Felipe Madson (@FelipeMadson)
 * License: MIT
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliTsPath = path.resolve(__dirname, '../src/cli.ts');
const args = process.argv.slice(2);

const result = spawnSync(process.execPath, ['--experimental-strip-types', cliTsPath, ...args], {
  stdio: 'inherit',
  env: process.env
});

process.exit(result.status ?? (result.error ? 1 : 0));
