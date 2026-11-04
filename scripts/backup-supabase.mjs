#!/usr/bin/env node
// Back up a Supabase Postgres database to backups/<time>-<target>/ (roles.sql, schema.sql, data.sql).
// Follows https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
// Needs: Node 20+, Docker Desktop running (the Supabase CLI runs pg_dump in a container), internet.
//
//   node scripts/backup-supabase.mjs            # dev: reads SUPABASE_DEV_DB_URL from .env
//   node scripts/backup-supabase.mjs --dry-run  # print the commands (password hidden), run nothing
//   node scripts/backup-supabase.mjs --prod     # prod: reads SUPABASE_PROD_DB_URL from the shell only,
//                                               # never from .env (keep prod secrets off the dev setup)
//
// Not included: files in Supabase Storage (only their metadata rows), Edge Function code, project settings.
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'

// Pinned: Supabase CLI 3.0 (02/11/2026) renamed --db-url to --remote. Update both together after testing.
const SUPABASE_CLI = 'supabase@2.122.1'

const args = process.argv.slice(2)
const unknown = args.filter(a => !['--dry-run', '--prod'].includes(a))
if (unknown.length) {
  console.error(`Không hiểu: ${unknown.join(' ')}. Chỉ dùng --dry-run và/hoặc --prod.`)
  process.exit(1)
}
const dryRun = args.includes('--dry-run')
const target = args.includes('--prod') ? 'prod' : 'dev'
const varName = target === 'prod' ? 'SUPABASE_PROD_DB_URL' : 'SUPABASE_DEV_DB_URL'

function readDotEnv(file) {
  if (!existsSync(file)) return {}
  const out = {}
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2')
  }
  return out
}

const fromEnvFile = target === 'dev' ? readDotEnv('.env')[varName] : undefined
const url = process.env[varName] || fromEnvFile
if (!url || url.includes('[YOUR-PASSWORD]') || url.includes('<')) {
  console.error(`Thiếu ${varName}. ${target === 'dev'
    ? 'Mở .env, điền dòng SUPABASE_DEV_DB_URL=... (Supabase > Connect > Session pooler). Xem .env.example.'
    : 'Đặt biến này trong cửa sổ terminal hiện tại (không ghi vào .env). Xem .agents/skills/backup-supabase/SKILL.md.'}`)
  process.exit(1)
}
let parsed
try { parsed = new URL(url) } catch {
  console.error(`${varName} không phải connection string hợp lệ. Mật khẩu có ký tự đặc biệt thì mã hoá (@ thành %40).`)
  process.exit(1)
}
if (process.platform === 'win32' && url.includes('"')) {
  console.error('Mật khẩu có dấu ", hãy mã hoá thành %22.')
  process.exit(1)
}
// Show which project this is (the ref is not secret) so a dev/prod mix-up is visible before anything runs.
const ref = (decodeURIComponent(parsed.username).split('.')[1] || parsed.hostname.split('.')[1] || '?')
console.log(`Sao lưu ${target.toUpperCase()}, project ref: ${ref}. Sai project thì bấm Ctrl+C ngay.`)

const hide = s => {
  if (s !== url) return s
  const u = new URL(url)
  if (u.password) u.password = '***'
  for (const k of [...u.searchParams.keys()]) if (/pass/i.test(k)) u.searchParams.set(k, '***')
  return u.toString()
}
const d = new Date(), p2 = n => String(n).padStart(2, '0')
const stamp = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}_${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`
const dir = join('backups', `${stamp}-${target}`)
const steps = [
  ['roles.sql', ['--role-only']],
  ['schema.sql', []],
  ['data.sql', ['--use-copy', '--data-only', '-x', 'storage.buckets_vectors', '-x', 'storage.vector_indexes']],
]

function npx(argv) {
  // Run npm's npx script with this same node binary when it can be found: no shell, so no quoting issues.
  const base = dirname(process.execPath)
  const cli = [join(base, 'node_modules/npm/bin/npx-cli.js'), join(base, '../lib/node_modules/npm/bin/npx-cli.js')].find(existsSync)
  if (cli) return spawnSync(process.execPath, [cli, ...argv], { stdio: 'inherit' })
  if (process.platform !== 'win32') return spawnSync('npx', argv, { stdio: 'inherit' })
  // Windows fallback: npx is a .cmd shim and needs a shell; quote every argument.
  return spawnSync('npx', argv.map(a => `"${a}"`), { stdio: 'inherit', shell: true })
}

if (!dryRun) {
  const docker = spawnSync('docker', ['info'], { stdio: 'ignore', shell: process.platform === 'win32' })
  if (docker.status !== 0) {
    console.error('Docker chưa chạy. Mở Docker Desktop, đợi nó báo "running", rồi chạy lại.')
    process.exit(1)
  }
  mkdirSync(dir, { recursive: true })
}

for (const [file, extra] of steps) {
  const argv = ['--yes', SUPABASE_CLI, 'db', 'dump', '--db-url', url, '-f', join(dir, file), ...extra]
  console.log(`> npx ${argv.map(hide).join(' ')}`)
  if (dryRun) continue
  const r = npx(argv)
  if (r.status !== 0) {
    console.error(`Lỗi khi tạo ${file}. Đọc thông báo ở trên; bản sao lưu chưa đủ.`)
    process.exit(r.status || 1)
  }
}
console.log(dryRun ? 'Dry run: chưa chạy gì.' : `Xong: ${dir}. Chép thư mục này ra chỗ an toàn (ổ ngoài, Drive cá nhân); không commit.`)
