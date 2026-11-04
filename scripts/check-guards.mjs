#!/usr/bin/env node
// Prints what each safety layer decides for sample commands. Nothing here is executed.
// Run: node scripts/check-guards.mjs   (the Codex column needs the `codex` CLI on PATH)
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { check } from '../.codex/hooks/guard.mjs'

const rules = fileURLToPath(new URL('../.codex/rules/default.rules', import.meta.url))
const samples = [
  'git reset --hard', 'git push -f origin main', 'git push origin main --force', 'git push origin main',
  'rm -rf src', 'rm -rf node_modules', 'Remove-Item -Recurse -Force src', 'git clean -fd',
  'npx supabase db push', 'npx supabase db reset --linked', 'npx wrangler pages deploy dist',
  'psql -c "drop table expenses"', 'cat .env', 'npm run build', 'git status', 'git commit -m "Mốc 1"',
]

function codexDecision(cmd) {
  const argv = cmd.match(/"[^"]*"|\S+/g).map(s => s.replace(/^"|"$/g, ''))
  const r = spawnSync('codex', ['execpolicy', 'check', '--rules', rules, '--', ...argv], { encoding: 'utf8', shell: process.platform === 'win32' })
  if (r.error || r.status !== 0) return 'n/a'
  try { return JSON.parse(r.stdout.trim().split('\n').pop()).decision || '-' } catch { return '?' }
}

console.log('command'.padEnd(36), 'hook'.padEnd(8), 'codex rules')
for (const c of samples) console.log(c.padEnd(36), (check(c) ? 'BLOCK' : 'ok').padEnd(8), codexDecision(c))
