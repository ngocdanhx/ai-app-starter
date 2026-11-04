// Run: node --test .codex/hooks/guard.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { check } from './guard.mjs'

const blocked = [
  'rm -rf /',
  'rm -rf ~',
  'rm -rf ~/Documents',
  'rm -rf .',
  'rm -rf ..',
  'rm -rf *',
  'rm -rf src',
  'rm -r -f supabase',
  'rm --recursive --force docs',
  'cd app && rm -rf node_modules && rm -rf .git',
  'bash -lc "rm -rf /"',
  'find . -name "*.tmp" | xargs rm -rf',
  'sudo rm -rf /var',
  'rm -rf $HOME/project',
  'Remove-Item -Recurse -Force C:\\Users\\me',
  'Remove-Item -Path src -Recurse',
  'powershell -NoProfile -Command "Remove-Item -Recurse -Force ."',
  'rm -r -fo backups',
  'rd /s /q C:\\',
  'cmd /c rmdir /s /q project',
  'git push --force',
  'git push -f origin main',
  'git push origin main --force-with-lease',
  'git push origin +main',
  'git push origin --delete feature',
  'git -C app push -f',
  'git reset --hard',
  'git reset --hard HEAD~3',
  'git clean -fdx',
  'git checkout -- .',
  'git restore .',
  'git branch -D old',
  'git stash clear',
  'psql "$DB_URL" -c "DROP TABLE expenses"',
  'psql -c "truncate expenses"',
  'psql -c "delete from expenses;"',
  'psql -c "alter table expenses disable row level security"',
  'npx supabase db reset --linked',
  'supabase db reset --db-url postgres://x',
  'supabase projects delete abc',
  'npx wrangler pages project delete my-app',
  'npx wrangler r2 bucket delete files',
  'gh repo delete me/app --yes',
  'find . -type f -delete',
  'cat .env',
  'Get-Content .env.local',
  'type .env.production',
  "sed -n '1,200p' .env",
  'rg SUPABASE .env',
  'grep KEY app/.env.local',
  'Select-String -Path .env -Pattern KEY',
  'cp .env /tmp/x',
  'find . -name "*.ts" -exec rm -rf {} +',
  'find src -exec rm -rf {} \\;',
  '(rm -rf src)',
  'echo $(rm -rf src)',
  '{ rm -rf src; }',
  'if true; then rm -rf src; fi',
  'for d in a b; do rm -rf "$d"; done',
  'gci src -Recurse | Remove-Item -Force',
  'Remove-Item -Recurse:$true src',
  'npx rimraf src',
  'git switch -f main',
  'git branch --delete --force old',
  'psql -c "drop index idx_x"',
  'psql -c "alter table expenses drop column note"',
]

const allowed = [
  'rm -rf node_modules',
  'rm -rf dist',
  'rm -rf app/node_modules app/dist',
  'Remove-Item -Recurse -Force node_modules',
  'rm src/old.ts',
  'rm -f build.log',
  'git rm -r --cached dist',
  'git status',
  'git add src/App.tsx',
  'git commit -m "Mốc 1: trang chủ"',
  'git push',
  'git push origin main',
  'git reset HEAD src/App.tsx',
  'git restore --staged .',
  'git checkout -b feature/login',
  'git log --oneline -5',
  'npm create vite@latest app -- --template react-ts',
  'npm install',
  'npm run build',
  'npx supabase db reset',
  'npx supabase migration new create_expenses',
  'cat .env.example',
  'cat src/env.ts',
  'node --test .codex/hooks/guard.test.mjs',
  'psql -c "delete from expenses where id = 1"',
  'echo "drop shipping" > notes.txt',
  'Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue',
  'Remove-Item -Recurse -Force node_modules,dist',
  'rm -rf node_modules package-lock.json',
  'rm -rf dist 2>/dev/null',
  'npx rimraf dist',
  'cp .env.example .env',
  'Copy-Item .env.example .env',
  'rg -n "drop table" supabase',
  'git log --grep "truncate"',
  'git commit -m "Mốc 3: drop policy cũ, thêm policy mới"',
  'git commit -m "Mốc 2 (form thêm khoản chi)"',
  'ls -la',
]

test('blocks destructive commands', () => {
  for (const c of blocked) assert.ok(check(c), `should block: ${c}`)
})

test('allows everyday commands', () => {
  for (const c of allowed) assert.equal(check(c), null, `should allow: ${c}`)
})

const guard = fileURLToPath(new URL('./guard.mjs', import.meta.url))
const run = input => spawnSync(process.execPath, [guard], { input: JSON.stringify(input), encoding: 'utf8' })

test('hook protocol: exit 2 with reason on stderr when blocked', () => {
  const r = run({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'git reset --hard' } })
  assert.equal(r.status, 2)
  assert.match(r.stderr, /git reset --hard/)
})

test('hook protocol: exit 0 for safe commands, other tools and bad input', () => {
  assert.equal(run({ tool_name: 'Bash', tool_input: { command: 'npm run build' } }).status, 0)
  assert.equal(run({ tool_name: 'apply_patch', tool_input: { command: 'rm -rf /' } }).status, 0)
  assert.equal(spawnSync(process.execPath, [guard], { input: 'not json', encoding: 'utf8' }).status, 0)
})
