#!/usr/bin/env node
// Guard for agent shell commands, shared by Codex (.codex/hooks.json) and Claude Code (.claude/settings.json).
// Reads the PreToolUse JSON from stdin. Exit 2 + reason on stderr = block (both tools honor this).
// This is a safety net for common mistakes, not a security boundary: it inspects the command text only.

// Regenerable build output and lockfiles: deleting them is a normal "clean reinstall".
const SAFE_DIRS = new Set([
  'node_modules', 'dist', 'build', '.vite', 'coverage', '.cache', '.turbo', '.next', '.wrangler', '.svelte-kit', 'out', 'tmp', '.tmp',
  'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb',
])
const DELETE_CMDS = new Set(['rm', 'remove-item', 'ri', 'del', 'erase', 'rd', 'rmdir', 'rimraf'])
// Tokens after which the next word is a command (wrappers, find -exec, shell control flow).
const PREFIX = new Set(['sudo', 'xargs', 'nohup', 'time', 'command', 'exec', 'env', '-c', '-lc', '-ic', '/c', '/k', '-command',
  '&', '.', '-exec', '-execdir', '-ok', 'then', 'do', 'else', 'npx', 'pnpm', 'dlx', 'bunx', '--yes', '-y'])
// PowerShell parameters whose next token is a value, not a path.
const PS_VALUE = /^-(erroraction|ea|warningaction|wa|include|exclude|filter|informationaction|ia|confirm|outvariable|ov|errorvariable|ev)$/

const ASK_USER = 'Lệnh này có thể làm mất dữ liệu hay sửa lịch sử git. Dừng lại, giải thích cho người dùng bằng lời thường nó làm gì, và để người dùng tự chạy nếu họ đồng ý.'

function segments(cmd) {
  // Quotes become spaces so wrapped scripts (bash -lc "...", powershell -Command "...") are inspected too.
  return cmd
    .replace(/[`"']/g, ' ')
    .replace(/\\/g, '/')
    .replace(/\$\(/g, ' ; ')
    .split(/&&|\|\||[;|\n&(){}]/)
    .map(s => s.trim().split(/\s+/).filter(Boolean).flatMap(t => t.split(',')).filter(Boolean))
    .filter(t => t.length)
}

function isSafeTarget(t) {
  if (/^[a-z]:/i.test(t) || t.startsWith('/') || t.startsWith('~') || t.includes('$') || t.includes('%')) return false
  if (/[*?]/.test(t)) return false
  const parts = t.replace(/^\.\//, '').split('/').filter(p => p && p !== '.')
  if (!parts.length || parts.includes('..')) return false
  return SAFE_DIRS.has(parts[parts.length - 1].toLowerCase())
}

function checkDelete(tokens) {
  for (let i = 0; i < tokens.length; i++) {
    const name = tokens[i].toLowerCase().split('/').pop().replace(/\.exe$/, '')
    if (!DELETE_CMDS.has(name)) continue
    if (i > 0 && !PREFIX.has(tokens[i - 1].toLowerCase()) && !/^\w+=/.test(tokens[i - 1])) continue
    const args = tokens.slice(i + 1)
    const cmdStyle = ['rd', 'rmdir', 'del', 'erase'].includes(name)
    let recursive = false
    const targets = []
    for (let j = 0; j < args.length; j++) {
      const a = args[j], l = a.toLowerCase()
      if (cmdStyle && /^\/[a-z]$/.test(l)) { if (l === '/s') recursive = true; continue }
      if (/^\d?>>?|^[<>]/.test(a)) { if (/^\d?>>?$|^[<>]$/.test(a)) j++; continue } // redirections: 2>/dev/null, > log
      if (PS_VALUE.test(l)) { j++; continue }
      if (l.startsWith('-')) {
        // Unix clusters (-rf, -Rf, -rfv), GNU --recursive, PowerShell -Recurse[:$true] and its prefixes (-r, -rec).
        const flag = l.split(':')[0]
        if (flag === '--recursive' || /^-[rfvdi]+$/.test(flag) && flag.includes('r') || flag.length >= 2 && 'recurse'.startsWith(flag.slice(1))) recursive = true
        continue
      }
      targets.push(a)
    }
    if (name === 'rimraf') recursive = true
    // Remove-Item fed from a pipeline (gci -Recurse | Remove-Item) or xargs: no visible target.
    if (!targets.length && (recursive || i > 0 || ['remove-item', 'ri', 'del', 'erase'].includes(name))) return 'Xoá hàng loạt không rõ đích (qua pipe hay xargs).'
    if (!recursive) continue
    const bad = targets.filter(t => !isSafeTarget(t))
    if (bad.length) return `Xoá đệ quy ngoài các thư mục sinh lại được (${[...SAFE_DIRS].slice(0, 4).join(', ')}…): ${bad.join(' ')}`
  }
  return null
}

function checkGit(tokens) {
  const g = tokens.findIndex(t => /(^|\/)git(\.exe)?$/i.test(t))
  if (g < 0) return null
  const rest = tokens.slice(g + 1)
  // Skip global options such as -C dir / -c key=value.
  let k = 0
  while (k < rest.length && rest[k].startsWith('-')) k += ['-c', '-C'].includes(rest[k]) ? 2 : 1
  const sub = (rest[k] || '').toLowerCase()
  const args = rest.slice(k + 1)
  const has = f => args.includes(f)
  if (sub === 'push') {
    if (has('--force') || has('-f') || args.some(a => /^--force-with-lease|^--force-if-includes|^\+/.test(a)) || args.some(a => /^-[a-z]*f[a-z]*$/.test(a)))
      return 'git push ép (force) ghi đè lịch sử trên GitHub.'
    if (has('--delete') || has('-d') || args.some(a => a.startsWith(':') && a.length > 1)) return 'git push xoá nhánh hay tag trên GitHub.'
  }
  if (sub === 'reset' && has('--hard')) return 'git reset --hard xoá mọi thay đổi chưa commit.'
  if (sub === 'clean' && args.some(a => /^-[a-z]*f/.test(a) || a === '--force')) return 'git clean xoá file chưa được git theo dõi.'
  if (sub === 'checkout' && (has('.') || has('--force') || has('-f'))) return 'git checkout . bỏ mọi thay đổi chưa commit.'
  if (sub === 'restore' && (has('.') || has(':/')) && (!has('--staged') || has('--worktree') || has('-W'))) return 'git restore . bỏ mọi thay đổi chưa commit.'
  if (sub === 'branch' && (has('-D') || ((has('-d') || has('--delete')) && (has('--force') || has('-f'))))) return 'git branch -D xoá nhánh chưa gộp.'
  if (sub === 'switch' && (has('-f') || has('--force') || has('--discard-changes'))) return 'git switch -f bỏ mọi thay đổi chưa commit.'
  if (sub === 'stash' && ['drop', 'clear'].includes((args[0] || '').toLowerCase())) return 'git stash drop/clear xoá phần việc đã cất.'
  if (sub === 'filter-branch' || sub === 'filter-repo') return 'Viết lại toàn bộ lịch sử git.'
  return null
}

// Commands that only search or describe text: SQL words inside them are not executed.
const TEXT_ONLY = /^\s*(rg|grep|findstr|select-string|sls|git\s+(log|grep|commit|show|diff))\b/i

function mentionsEnvFile(cmd) {
  const tokens = cmd.replace(/[`"'=,;|&()<>]/g, ' ').replace(/\\/g, '/').split(/\s+/)
  const env = tokens.filter(t => /(^|\/)\.env(\.[\w.-]+)?$/i.test(t) && !/\.env\.example$/i.test(t))
  if (!env.length) return false
  // Creating .env from the template is fine: cp .env.example .env / Copy-Item .env.example .env
  if (/\.gitignore\b/.test(cmd)) return false
  if (/^\s*(cp|copy|copy-item|cpi)\s+(-\S+\s+)*\S*\.env\.example\s+\S*\.env\s*$/i.test(cmd)) return false
  return true
}

function checkText(cmd) {
  const c = cmd.toLowerCase()
  if (mentionsEnvFile(cmd)) return 'Lệnh đụng tới file .env (nơi giữ secret): đọc, chép hay sửa nó có thể làm lộ key vào cuộc trò chuyện. Nhờ người dùng tự mở .env; cần kiểm thì hỏi tên biến, không hỏi giá trị.'
  if (TEXT_ONLY.test(cmd)) return null
  const rules = [
    [/\bdrop\s+(table|schema|database|view|materialized\s+view|function|policy|role|owned|index|type|extension|trigger|column)\b/, 'Lệnh SQL DROP xoá cấu trúc hay dữ liệu.'],
    [/\btruncate\s+(table\s+)?["\w]/, 'Lệnh SQL TRUNCATE xoá sạch bảng.'],
    [/\bdelete\s+from\s+[\w."]+\s*(;|"|'|$)/m, 'Lệnh SQL DELETE không có WHERE xoá cả bảng.'],
    [/\balter\s+table\b[^;]*\bdisable\s+row\s+level\s+security\b/, 'Tắt RLS làm lộ dữ liệu.'],
    [/\bsupabase\b.*\bdb\s+reset\b.*(--linked|--db-url)/, 'supabase db reset trên project thật xoá toàn bộ dữ liệu.'],
    [/\bsupabase\b.*\b(projects|branches|orgs)\s+delete\b/, 'Xoá project/branch Supabase.'],
    [/\bsupabase\b.*\bstorage\s+rm\b/, 'Xoá file trong Supabase Storage.'],
    [/\bwrangler\b.*\b(delete|r2\s+bucket\s+delete|r2\s+object\s+delete|d1\s+delete|pages\s+project\s+delete|kv\s+namespace\s+delete)\b/, 'Xoá tài nguyên Cloudflare.'],
    [/\bvercel\b.*\b(remove|rm|project\s+rm)\b/, 'Xoá project/deployment Vercel.'],
    [/\bgh\b.*\brepo\s+(delete|archive)\b/, 'Xoá hay khoá repo GitHub.'],
    [/\bgh\b.*\brepo\s+edit\b.*--visibility/, 'Đổi repo sang public/private.'],
    [/\bfind\b.*\s-delete\b/, 'find -delete xoá hàng loạt.'],
    [/\b(mkfs|diskpart|format-volume)\b|\bformat\s+[a-z]:|\bdd\b.*\bof=\/dev\//, 'Lệnh ghi đè ổ đĩa.'],
  ]
  for (const [re, why] of rules) if (re.test(c)) return why
  return null
}

export function check(command) {
  const cmd = Array.isArray(command) ? command.join(' ') : String(command || '')
  for (const t of segments(cmd)) {
    const why = checkDelete(t) || checkGit(t)
    if (why) return why
  }
  return checkText(cmd)
}

async function main() {
  let raw = ''
  for await (const chunk of process.stdin) raw += chunk
  let input
  try { input = JSON.parse(raw || '{}') } catch { return }
  const tool = String(input.tool_name || '')
  if (!/^(Bash|PowerShell|shell|exec_command|local_shell)$/i.test(tool)) return
  const ti = input.tool_input || {}
  const why = check(ti.command ?? ti.cmd ?? '')
  if (!why) return
  process.stderr.write(`Bị chặn bởi .codex/hooks/guard.mjs: ${why} ${ASK_USER}\n`)
  process.exit(2)
}

if ((process.argv[1] || '').replace(/\\/g, '/').endsWith('/guard.mjs')) main()
