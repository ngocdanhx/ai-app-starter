# AI App Starter

Bộ khung để bạn cùng **Codex** (hoặc Claude Code) dựng một web app từ đầu, kể cả khi mới biết chút code.
Repo không có sẵn app. Bạn kể ý tưởng, agent hỏi lại vài câu, đề xuất giải pháp và chi phí, bạn đồng ý thì nó
mới làm, từng mốc nhỏ một, mốc nào cũng mở ra xem được.

Cẩm nang đầy đủ (cài trên Windows, chi phí, an toàn, gỡ lỗi): **[docs/guide.pdf](docs/guide.pdf)**
(bản chữ: [docs/guide.md](docs/guide.md)).

## Bắt đầu nhanh

1. Bấm **Use this template** > **Create a new repository** trên GitHub. Chọn **Private** nếu chưa muốn công khai.
2. Clone repo mới về máy (VS Code: **Clone Git Repository**, dán link repo).
3. Mở thư mục đó bằng Codex (app ChatGPT trên máy tính, extension `openai.chatgpt` trong VS Code, hoặc CLI `codex`).
   Mở đúng **thư mục gốc của repo**, không mở thư mục con.
4. Khi Codex hỏi có tin thư mục này không, chọn **trust**. Không trust thì Codex bỏ qua toàn bộ `.codex/`
   (cấu hình, lớp chặn lệnh).
5. Duyệt hook một lần: trong terminal của VS Code gõ `codex`, rồi gõ `/hooks`, xem hook `guard.mjs` và chọn trust.
   Codex chỉ chạy hook sau khi bạn duyệt, và hỏi lại mỗi khi file hook đổi. (Bước này theo docs Codex; bộ khung
   chưa thử màn `/hooks` trên Windows. Xem cách kiểm hook đang chạy ở dưới.)
6. Gõ câu đầu tiên, ví dụ: `Mình muốn làm app ghi chi tiêu cá nhân.` Agent sẽ hỏi lại tối đa 5 câu có gợi ý.

## Trong repo có gì

| File / thư mục | Để làm gì |
|---|---|
| `AGENTS.md` | Luật cho agent: luồng hỏi → đề xuất → plan → làm từng mốc, stack mặc định, bảo mật |
| `CLAUDE.md` | Một dòng `@AGENTS.md` để Claude Code đọc cùng luật |
| `docs/brief.md`, `decisions.md`, `plan.md`, `progress.md` | Mẫu trống; agent điền dần, phiên sau đọc lại để làm tiếp |
| `.agents/skills/` | Skill: `kickoff`, `security-check`, `deploy-cloudflare-pages`, `backup-supabase` |
| `.codex/config.toml` | Codex: hỏi trước khi ra ngoài thư mục dự án, sandbox chỉ ghi trong dự án, bật hook |
| `.codex/hooks.json`, `.codex/hooks/guard.mjs` | Hook chặn lệnh phá huỷ trước khi chạy (dùng chung cho Claude) |
| `.codex/rules/default.rules` | Rules của Codex: cấm `git reset --hard`, push ép; hỏi trước `git push`, `rm -rf`, lệnh Supabase/Cloudflare |
| `.claude/settings.json` | Claude Code: chặn đọc `.env`, chặn/hỏi lệnh nguy hiểm, gọi cùng hook |
| `scripts/backup-supabase.mjs` | Sao lưu database Supabase ra `backups/` (cần Docker Desktop) |
| `scripts/check-guards.mjs` | In bảng lớp chặn nào quyết định gì cho các lệnh mẫu (không chạy lệnh nào) |
| `.env.example` | Mẫu biến môi trường; chép thành `.env` rồi điền. `.env` không bao giờ lên git |
| `docs/verification.md` | Đã kiểm gì, bằng phiên bản nào, kết quả |

## Lớp bảo vệ và giới hạn của nó

Có ba lớp, lớp sau đỡ cho lớp trước:

1. **Chữ trong `AGENTS.md`**: agent được dặn không chạy lệnh phá huỷ, hỏi trước khi tốn tiền hay đưa ra công khai.
2. **Hook `guard.mjs`** (Codex và Claude Code): đọc lệnh trước khi chạy, chặn `rm -rf` ngoài các thư mục sinh lại
   được (`node_modules`, `dist`…), `Remove-Item -Recurse`, push ép, `git reset --hard`, `git clean -f`,
   `DROP`/`TRUNCATE`/`DELETE` không `WHERE`, `supabase db reset --linked`, xoá tài nguyên cloud, mọi lệnh đụng
   file `.env` (trừ tạo `.env` từ `.env.example`).
3. **Rules / permissions**: Codex `prefix_rule` (cấm hay hỏi theo đầu lệnh), Claude `deny`/`ask`.
   Sandbox của Codex giữ `.git` chỉ đọc, nên rules cho phép sẵn `git add` và `git commit` để mỗi mốc commit
   không phải bấm duyệt; `git push` vẫn hỏi.

Lớp quan trọng nhất không nằm trong repo: **agent không có mật khẩu database prod**. Không có thì không phá được.

Giới hạn, nói thẳng:
- Codex chỉ nạp `.codex/` khi bạn trust dự án, và chỉ chạy hook khi bạn đã duyệt ở `/hooks`. Bạn (hoặc agent nếu
  bạn cho phép) có thể tắt mọi lớp này.
- Hook và rules đọc **chữ của lệnh**. Lệnh viết vòng (script Python/Node tự xoá file, SQL nằm trong file, công cụ
  MCP) có thể lọt. Đây là lưới an toàn chống nhầm, không phải hàng rào bảo mật.
- Hook cần `node` trên máy. Thiếu `node` thì hook lỗi và Codex vẫn chạy lệnh.
- Trên Windows, hook gọi `node .codex/hooks/guard.mjs` theo thư mục đang mở, nên phải mở Codex ở gốc repo.
- **Chưa kiểm trên Windows**: hook, rules, script backup mới chạy thử trên macOS (xem `docs/verification.md`).
  Codex trên Windows chạy lệnh bằng PowerShell; chưa rõ rules `prefix_rule` có tách được lệnh PowerShell không,
  hook thì có mẫu cho `Remove-Item`, `rd /s`, `del /s`.

Kiểm nhanh các lớp đang chạy:

```
node --test .codex/hooks/guard.test.mjs     # hook chặn đúng, không chặn nhầm lệnh thường
node scripts/check-guards.mjs               # bảng: lệnh mẫu, hook, rules của Codex
```

Trong Codex, khi chưa có file `.env`, nhờ agent: "chạy lệnh `cat .env`". Thấy báo
`Bị chặn bởi .codex/hooks/guard.mjs` là hook đang chạy. (Lệnh này vô hại vì chưa có `.env`.)

## Tuỳ chọn nâng cao

Luồng "hỏi ý định → spec → plan → làm từng phần" mượn ý từ hai bộ công cụ dưới đây. Không cần cài; khi đã quen,
có thể thử:
- [obra/superpowers](https://github.com/obra/superpowers): bộ skill quy trình cho agent (brainstorm, plan, TDD).
- [github/spec-kit](https://github.com/github/spec-kit): viết spec trước rồi để agent làm theo spec.

## Nguồn chính

- Codex: [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md),
  [config](https://learn.chatgpt.com/docs/config-file/config-basic),
  [rules](https://learn.chatgpt.com/docs/agent-configuration/rules), [hooks](https://learn.chatgpt.com/docs/hooks),
  [skills](https://learn.chatgpt.com/docs/build-skills), [Windows](https://learn.chatgpt.com/docs/windows/windows-sandbox)
- Claude Code: [permissions](https://code.claude.com/docs/en/permissions), [hooks](https://code.claude.com/docs/en/hooks),
  [memory](https://code.claude.com/docs/en/memory)
- Supabase: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
  [MCP](https://supabase.com/docs/guides/getting-started/mcp),
  [backup](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)

Giấy phép: MIT ([LICENSE](LICENSE)).
