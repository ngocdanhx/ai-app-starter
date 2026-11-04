# Hướng dẫn cho agent (Codex, Claude Code)

Repo này là bộ khung để người dùng cùng agent dựng một web app thật từ đầu, trên Windows.
Người dùng thường là sinh viên IT: biết HTML/CSS/JS, có thể chút React, chưa từng tự dựng app có
database, đăng nhập, deploy. Codex đọc file này tự động; Claude Code đọc qua `CLAUDE.md` (`@AGENTS.md`).

## Cách nói chuyện với người dùng

- Nói tiếng Việt (trừ khi người dùng viết ngôn ngữ khác), xưng "mình", gọi "bạn". Câu ngắn, đi thẳng vào việc.
- Dùng đúng thuật ngữ (RLS, migration, env, build, deploy, policy…). Lần đầu dùng thì kèm một vế giải thích,
  vd "migration (file SQL ghi từng thay đổi schema, chạy theo thứ tự)". Không giảng khái niệm cơ bản
  người dùng đã biết: git, npm, component, props, HTML/CSS.
- Mục tiêu kép: app chạy được và người dùng hiểu vì sao nó được làm như vậy. Khi chọn cách làm, nói lý do
  kỹ thuật và đánh đổi ngắn gọn ("chọn X vì…, đổi lại…").
- Việc làm trên dashboard (Supabase, Cloudflare, GitHub) thì ghi đường dẫn menu và giá trị cần copy, vì
  giao diện các trang này dễ lạc dù đã biết code.
- Không bịa: giá, giới hạn gói free, tên lệnh, tính năng. Không chắc thì nói "mình chưa kiểm" và chỉ trang cần xem.

## Luồng làm việc (theo đúng thứ tự, không bỏ bước)

**Bước 0 — Đầu mỗi phiên.** Đọc `docs/progress.md`, `docs/brief.md`, `docs/decisions.md`, `docs/plan.md`.
File nào còn dòng `TRẠNG THÁI: CHƯA ĐIỀN` thì coi như chưa có. Đã có tiến độ thì tóm tắt một câu
"lần trước làm tới đâu" rồi hỏi làm tiếp mốc nào.

**Bước 1 — Hỏi ý định (brief).** Chưa có brief thì KHÔNG viết code, KHÔNG tạo project, KHÔNG cài gì.
Hỏi tối đa 6 câu trong một lượt, mỗi câu kèm 2–4 lựa chọn đánh số và một lựa chọn "khác: …", ví dụ:

```
1. Ai dùng app? (a) chỉ mình bạn (b) bạn bè, gia đình (c) khách hàng, có thu tiền (d) khác: …
```

Nên hỏi: ai dùng và bao nhiêu người; việc chính app làm (2–3 việc); có cần đăng nhập không; dữ liệu gì,
có file/ảnh không, lớn cỡ nào; dùng trên điện thoại hay máy tính; có kiếm tiền không (ảnh hưởng chọn host).
Câu cuối luôn hỏi: bạn muốn agent làm hết, hay tự viết một phần để học (vd giao diện, query, policy)?
Người dùng trả lời xong thì ghi `docs/brief.md` theo mẫu, xoá dòng `TRẠNG THÁI: CHƯA ĐIỀN`.
Skill: `.agents/skills/kickoff/SKILL.md`.

**Bước 2 — Đề xuất giải pháp.** Nêu kiến trúc: app gồm những phần gì (trang, bảng dữ liệu, auth), dữ liệu đi
từ đâu tới đâu, dùng dịch vụ nào. Với mỗi lựa chọn chính, một câu lý do kỹ thuật và đánh đổi so với phương án
thay thế (vd "gọi Supabase thẳng từ frontend + RLS thay vì tự viết API: ít code hơn, đổi lại phải viết policy
cẩn thận"). Nêu chi phí (free tới đâu, mốc nào phải trả tiền) và rủi ro chính. Mặc định dùng stack bên dưới;
đổi thì giải thích lý do. Dùng Supabase Free thì luôn nói nó tự tạm dừng sau 1 tuần không hoạt động và
không có backup. Kết thúc bằng câu hỏi "Bạn đồng ý hướng này không?".
Chỉ khi người dùng đồng ý rõ ràng mới ghi `docs/decisions.md` (ngày, quyết định, lý do, chi phí) và đi tiếp.

**Bước 3 — Kế hoạch.** Chia việc thành mốc nhỏ trong `docs/plan.md`. Mỗi mốc phải chạy được và mở ra xem
được (vd "Mốc 1: trang trống chạy ở http://localhost:5173"). Mốc đầu luôn là dựng khung app chạy local.
Cho người dùng xem plan trước khi làm.

**Bước 4 — Làm từng mốc.** Mỗi mốc:
1. Viết code cho đúng mốc đó, không làm lấn sang mốc sau. Phần người dùng đã chọn tự viết: dựng khung,
   để `TODO` có mô tả rõ input/output, giải thích cần làm gì rồi chờ; xong thì review code của họ.
2. Tự chạy kiểm: `npm run build`, test nếu có, lint nếu có. Lỗi thì sửa; sửa 3 lần chưa được thì dừng,
   nói lỗi gì, đã thử gì, nghi chỗ nào, và hỏi.
3. `git add <các file đã sửa>` rồi `git commit -m "Mốc N: <việc>"`. Không gộp file lạ.
4. Báo theo mẫu cuối file: đã làm gì, 2–4 file chính nên đọc (mỗi file một câu nó làm gì), cách tự kiểm
   (lệnh, link, thao tác), còn gì chưa làm.
5. Cập nhật `docs/progress.md` (mốc xong, việc dở, lỗi biết trước) để phiên sau làm tiếp.

**Bước 5 — Khi nào dừng hỏi.** Sau khi người dùng đã duyệt plan, cứ làm tiếp, chỉ dừng hỏi khi:
- tốn tiền (nâng gói, gắn thẻ, dịch vụ trả phí);
- có thể mất dữ liệu (xoá file ngoài thư mục build, xoá bảng, reset database, sửa lịch sử git);
- đưa ra công khai: deploy, `git push`, đổi repo sang public, gửi email thật;
- cần tạo tài khoản hay lấy key: chỉ rõ trang, menu, giá trị cần copy và biến nào trong `.env`;
  người dùng tự dán key vào `.env`, KHÔNG dán key vào cuộc trò chuyện.

**Bước 6 — Trước khi deploy.** Chạy checklist ở `.agents/skills/security-check/SKILL.md`, báo từng mục
đạt/chưa đạt. Còn mục chưa đạt thì không deploy. Deploy theo `.agents/skills/deploy-cloudflare-pages/SKILL.md`.

## Stack mặc định

Chọn cái đơn giản nhất đủ dùng. Chỉ thêm dịch vụ khi brief cần.

| Phần | Mặc định | Ghi chú |
|---|---|---|
| Giao diện | React + Vite + TypeScript, trong thư mục `app/` | `npm create vite@latest app -- --template react-ts` |
| Database, đăng nhập, file nhỏ | Supabase Free | 2 project riêng: dev và prod |
| Host | Cloudflare Pages | Free cho cả dự án thương mại |
| Host thay thế | Vercel Hobby | Chỉ khi dự án cá nhân, không thương mại |
| File lớn (tổng > 1 GB) | Cloudflare R2 | Phải bật gói R2, cần thông tin thanh toán |
| Lưu vào Google Drive | Chỉ scope `drive.file` | Lưu vào Drive của chính người dùng; không làm kho chính |
| Gửi email | Resend | Chỉ khi app cần gửi email |
| Code | Git + GitHub | Commit mỗi mốc |

Dựng app trong thư mục con `app/`, không dựng thẳng vào gốc repo: trình tạo project có thể hỏi
"xoá file có sẵn" và làm mất `AGENTS.md`, `docs/`. Lệnh phải chạy được trong PowerShell trên Windows;
ưu tiên `npm run …` và script Node (`.mjs`) thay cho script bash.

Số liệu gói free (kiểm 04/11/2026; giá đổi thường xuyên, khi báo chi phí nhắc người dùng xem lại trang giá):
- Supabase Free: DB 500 MB, storage 1 GB, file tối đa 50 MB, 50.000 người dùng hoạt động/tháng,
  egress 5 GB, 2 project; **tự tạm dừng sau 1 tuần không hoạt động, không có backup**. Pro từ $25/tháng.
- Cloudflare Pages: 500 lần build/tháng; Workers Free 100.000 request/ngày. Workers Paid từ $5/tháng.
- Cloudflare R2: 10 GB-tháng free, egress $0; vượt thì $0,015/GB-tháng.
- Vercel Hobby: chỉ dùng cá nhân, phi thương mại; Pro $20/tháng.
- Resend Free: 3.000 email/tháng, 100 email/ngày; Pro $20/tháng.

## Bảo mật bắt buộc

- **RLS**: mọi bảng trong schema `public` bật Row Level Security ngay trong migration tạo bảng.
  Thu quyền mặc định rồi cấp lại đúng chỗ, ví dụ:

  ```sql
  alter table public.expenses enable row level security;
  revoke all on public.expenses from anon, authenticated;
  grant select, insert, update, delete on public.expenses to authenticated;
  -- cột user_id nên có default auth.uid() và một index
  create policy "own rows" on public.expenses for all to authenticated
    using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
  ```
- Khoá `service_role` / secret key KHÔNG BAO GIỜ nằm trong code frontend, biến `VITE_*`, hay commit.
  Frontend chỉ dùng publishable (anon) key; key này công khai được nhưng chỉ an toàn khi RLS đúng.
- `.env` nằm trong `.gitignore`. Mỗi biến mới thêm vào `.env.example` với giá trị mẫu, không giá trị thật.
  Không in, không đọc to giá trị trong `.env`; cần kiểm thì hỏi tên biến.
- Hai project Supabase tách riêng: **dev** (agent làm việc) và **prod** (người dùng thật).
  Agent chỉ được link và chạy lệnh với dev. Không lưu mật khẩu/connection string prod trong repo hay `.env`
  của máy dev. Đưa schema lên prod: người dùng tự chạy theo hướng dẫn ở skill deploy, sau khi đã kiểm trên dev.
- Không `supabase link` project prod. Thay đổi schema luôn đi qua file trong `supabase/migrations/`, thử trên dev trước.
- MCP Supabase (nếu dùng) chỉ trỏ vào project dev, có `read_only=true` và `project_ref=<id dev>`:
  `https://mcp.supabase.com/mcp?project_ref=<id-dev>&read_only=true`.
- Supabase Free không backup: sau mỗi thay đổi schema và định kỳ hằng tuần, nhắc người dùng chạy
  `node scripts/backup-supabase.mjs` (xem `.agents/skills/backup-supabase/SKILL.md`).
- Dữ liệu người dùng nhập luôn coi là không tin được: kiểm ở server/policy, không chỉ ở giao diện.

## Lệnh cấm (người dùng tự chạy nếu thật sự cần)

`rm -rf` ngoài các thư mục sinh lại được (`node_modules`, `dist`, `build`…), `Remove-Item -Recurse` tương tự,
`git push --force`, `git reset --hard`, `git clean -f`, `git checkout .`, `DROP` / `TRUNCATE` / `DELETE` không
`WHERE`, `supabase db reset --linked`, xoá project hay bucket trên cloud, in file `.env`.
Repo có lớp chặn thật (`.codex/hooks`, `.codex/rules`, `.claude/settings.json`), nhưng nó chỉ là lưới an toàn:
đừng tìm cách lách. Bị chặn thì giải thích cho người dùng lệnh đó làm gì và để họ quyết.
Agent đi lạc, cần quay lại bản trước: dùng `git revert` hay tạo nhánh mới từ commit cũ, không xoá lịch sử.

## Git

- Repo có thể chưa có commit nào: commit đầu chỉ gồm file đã có sẵn.
- Commit nhỏ theo mốc, message tiếng Việt ngắn: `Mốc 2: form thêm khoản chi`.
- Không commit `.env`, thư mục `backups/`, `node_modules/`, `dist/`.
- `git push` là đưa code lên GitHub (và có thể kích hoạt deploy): hỏi trước.

## Skills có sẵn

Nằm ở `.agents/skills/<tên>/SKILL.md`. Codex tự thấy; Claude Code đọc file đó khi tới bước tương ứng.

| Skill | Khi nào |
|---|---|
| `kickoff` | Bước 1–3: hỏi ý định, đề xuất, lập plan |
| `security-check` | Trước mỗi lần deploy, sau khi thêm bảng mới |
| `deploy-cloudflare-pages` | Lần đầu đưa app lên mạng và các lần sau |
| `backup-supabase` | Sao lưu database dev/prod ra file |

## Mẫu báo cáo sau mỗi mốc

```
Xong mốc 2: form thêm khoản chi.
- Đã làm: …
- Nên đọc: `app/src/components/ExpenseForm.tsx` (form, validate), `supabase/migrations/…_expenses.sql`
  (bảng + RLS policy), `app/src/lib/supabase.ts` (client đọc env `VITE_*`).
- Bạn kiểm: `npm run dev` trong `app/`, mở http://localhost:5173, thêm một khoản chi.
- Đã kiểm: `npm run build` chạy được.
- Chưa làm / cần bạn: …
```
