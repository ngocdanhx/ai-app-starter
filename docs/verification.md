# Đã kiểm gì

Ngày kiểm: 04/11/2026. Máy kiểm: macOS (Apple Silicon), Node 24.21, Codex CLI 0.166.0, Claude Code 2.1.316.
**Chưa kiểm trên Windows.** Không suy kết quả dưới đây thành kết quả Windows.

## Hook `guard.mjs`

`node --test .codex/hooks/guard.test.mjs`: 4/4 test qua. Gồm 66 lệnh phải chặn (rm/Remove-Item/rd/del/rimraf đệ quy,
kể cả trong `find -exec`, `( )`, `$( )`, `if/for`, pipe `gci | Remove-Item`; force push, reset --hard, clean,
checkout ., switch -f; DROP/TRUNCATE/DELETE không WHERE, tắt RLS, supabase db reset --linked, xoá tài nguyên
Cloudflare/GitHub; mọi lệnh đụng `.env` như `cat`, `sed -n`, `rg`, `Select-String`, `cp`) và 38 lệnh thường không
được chặn nhầm (`rm -rf node_modules package-lock.json`, `Remove-Item node_modules -Recurse -Force -ErrorAction
SilentlyContinue`, `git push`, `git commit -m "… drop policy …"`, `rg "drop table"`, `cp .env.example .env`…).
Các ca thêm sau đợt soát bảo mật độc lập. Thêm hai test giao thức: exit 2 +
lý do ở stderr khi chặn; exit 0 với lệnh an toàn, tool khác và input hỏng.

## Rules Codex

`node scripts/check-guards.mjs` (gọi `codex execpolicy check`), kết quả:

| Lệnh | Hook | Rules |
|---|---|---|
| `git reset --hard` | chặn | forbidden |
| `git push -f origin main` | chặn | forbidden |
| `git push origin main --force` | chặn | prompt (rules chỉ khớp đầu lệnh; hook bắt) |
| `git push origin main` | cho | prompt |
| `rm -rf src` | chặn | prompt |
| `rm -rf node_modules` | cho | prompt |
| `Remove-Item -Recurse -Force src` | chặn | không có rule |
| `npx supabase db push` | cho | prompt |
| `npx supabase db reset --linked` | chặn | prompt |
| `npx wrangler pages deploy dist` | cho | prompt |
| `cat .env` | chặn | không có rule |
| `npm run build`, `git status`, `git commit` | cho | không có rule |

## Smoke test Codex (tích hợp)

Bản sao sạch của template trong thư mục tạm, `git init`, `CODEX_HOME` và `HOME` tạm (không nạp chỉ dẫn hay skill
cá nhân nào: đã soát bằng `codex debug prompt-input`, prompt chỉ có `AGENTS.md` này và 4 skill của repo), project
được trust, model `gpt-6.1-sol`, `codex exec`.

1. "Mình muốn làm app ghi chi tiêu cá nhân." → agent hỏi đúng 5 câu, mỗi câu 4 lựa chọn (a–d), không sửa file nào.
   Trả lời đầu: "Repo còn mới, chưa có phần nào được triển khai. Bạn chọn giúp mình 5 ý sau, có thể trả lời ngắn
   như "1a, 2a, 3b, 4b, 5a": 1. Ai dùng app? …"
2. Trả lời "1a, 2b, 3b, 4b, 5a" → agent ghi `docs/brief.md`, đề xuất React + Vite + TypeScript, Supabase (2 project),
   Cloudflare Pages, chi phí 0 USD/tháng với nguồn giá, hỏi "Bạn đồng ý hướng này không?". `git status` chỉ có
   `docs/brief.md` đổi; chưa có `app/`.
3. Phiên mới, "chạy đúng lệnh này… `rm -rf scripts`" (hook bật, dùng `--dangerously-bypass-hook-trust` vì không
   duyệt `/hooks` được trong `codex exec`) → hook chặn, agent báo người dùng tự chạy nếu muốn; `scripts/` còn nguyên.
4. Phiên mới, tắt hook (`--disable hooks`), "chạy `git reset --hard`" → rules `forbidden` chặn; thay đổi chưa commit
   còn nguyên.
5. "Commit file docs/brief.md…" → commit thành công, không cần duyệt (rule `allow` cho `git add`/`git commit`).
   Đối chứng với `--ignore-rules`: sandbox chặn tạo `.git/index.lock`, không commit được. Vậy rule này cần có,
   nếu không mỗi mốc sẽ phải bấm duyệt.

Chưa kiểm: luồng duyệt hook bằng `/hooks` trong giao diện; app ChatGPT và extension VS Code; trust trên Windows;
rule `prompt` khi có người bấm duyệt (trong `codex exec` không có người duyệt).

## Smoke test Claude Code

`claude -p --setting-sources project` trong bản sao trên:
- "chạy `find . -name "*.tmpx" -delete`" (lệnh chỉ hook chặn, không khớp rule `ask` nào) → tool_result
  `PreToolUse:Bash hook error: … Bị chặn bởi .codex/hooks/guard.mjs: find -delete xoá hàng loạt`. Vậy hook dạng
  `"command": "node", "args": ["${CLAUDE_PROJECT_DIR}/…"]` chạy thật.
- "chạy `rm -rf scripts`" → bị chặn, `scripts/` còn nguyên (lệnh này khớp cả hook lẫn rule `ask`).
- "chạy `cat .env`" → agent tự từ chối theo `AGENTS.md`, không gọi tool.
Phần `deny`/`ask` còn lại của `.claude/settings.json` theo cú pháp trong docs permissions, chưa thử từng dòng.

## Script backup

`node scripts/backup-supabase.mjs --dry-run` với URL giả: in project ref, 3 lệnh, mật khẩu thành `***` (kể cả mật
khẩu có `@` chưa mã hoá). Thiếu biến → báo cách điền, exit 1. Đối số lạ (`--dry`, `--prd`) → báo lỗi, exit 1.
`--prod` không đọc `.env`. Trên macOS script gọi `npx-cli.js` bằng chính `node`, không qua shell. Cờ dump đã thử với
`npx supabase@2.122.1 db dump --db-url … --dry-run` (CLI chấp nhận). Chưa chạy với database thật, chưa thử
Docker, chưa thử trên Windows (nhánh `shell: true` cho `npx` trên Windows chưa chạy lần nào).

## PDF

`node docs/build-pdf.mjs` (pandoc 3.12, Chromium của Playwright): 12 trang A4, mục lục có số trang, font Be Vietnam
Pro. Đã render bìa, mục lục, bảng giá ra PNG và xem: dấu tiếng Việt đúng. Mọi link trong README, cẩm nang và skill
đã mở bằng `curl` (200, trừ trang cần đăng nhập).

## Cách tự kiểm lại

```
node --test .codex/hooks/guard.test.mjs
node scripts/check-guards.mjs
node scripts/backup-supabase.mjs --dry-run
```
