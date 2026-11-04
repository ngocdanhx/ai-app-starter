---
name: security-check
description: Checklist bảo mật bắt buộc trước mỗi lần deploy và sau khi thêm bảng mới: secret, RLS, quyền, tách dev/prod, backup. Báo từng mục đạt/chưa đạt; còn mục chưa đạt thì không deploy.
---

# Security check trước khi deploy

Chạy từng mục, báo kết quả dạng bảng "mục | đạt/chưa | bằng chứng". Không in giá trị secret ra cuộc trò chuyện.

## 1. Secret không nằm trong git và frontend

- `git ls-files` không có `.env` (chỉ `.env.example`).
- Tìm trong file git đang theo dõi: `git grep -n -I -E "service_role|sb_secret_|-----BEGIN|sk_live_|re_[A-Za-z0-9]{20,}"`.
  Có kết quả thì xem từng dòng; secret thật thì dừng, báo người dùng đổi key trên dashboard (key đã lộ coi như mất).
- Build app (`npm run build` trong `app/`) rồi tìm trong `app/dist`: không có `service_role` hay `sb_secret_`.
- Biến `VITE_*` chỉ chứa URL và publishable/anon key.

## 2. RLS và quyền (trên project dev)

Người dùng chạy các câu sau trong Supabase > SQL Editor của project **dev** (hoặc agent chạy qua MCP read-only)
rồi dán kết quả:

```sql
-- Bảng chưa bật RLS (phải ra 0 dòng)
select tablename from pg_tables where schemaname = 'public' and not rowsecurity;

-- Quyền của anon/authenticated (chỉ đúng những quyền app cần)
select grantee, table_name, privilege_type from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated') order by 2, 1, 3;

-- Policy (cảnh giác với using (true) cho anon)
select tablename, policyname, roles, cmd, qual, with_check from pg_policies where schemaname = 'public';

-- View: mặc định chạy với quyền người tạo, bỏ qua RLS. Mỗi view phải có security_invoker=true
select relname, reloptions from pg_class where relnamespace = 'public'::regnamespace and relkind in ('v', 'm');

-- Hàm SECURITY DEFINER gọi được qua API (rpc) chạy bằng quyền chủ hàm: xem kỹ từng hàm
select proname from pg_proc where pronamespace = 'public'::regnamespace and prosecdef;

-- Policy của Storage (file người dùng tải lên)
select policyname, roles, cmd, qual, with_check from pg_policies where schemaname = 'storage' and tablename = 'objects';
```

- View (`relkind = 'v'`) mà `reloptions` không có `security_invoker=true` thì sửa bằng
  `alter view public.<tên> set (security_invoker = true);`. Materialized view (`'m'`) không có RLS: đừng để
  `anon`/`authenticated` đọc nếu chứa dữ liệu riêng.
- Hàm SECURITY DEFINER: chỉ giữ khi thật cần; trong hàm phải tự kiểm `auth.uid()`, đặt `set search_path = ''`.

- Thử bằng hai tài khoản: A tạo dữ liệu, đăng nhập B không thấy, không sửa được dữ liệu của A.
- Bucket Storage: bucket nào để public phải là cố ý (ảnh công khai); file riêng dùng bucket private + policy.

## 3. Tách dev và prod

- Project prod khác project dev. Env của Cloudflare Pages dùng URL + publishable key của **prod**.
- Không có connection string hay mật khẩu prod trong repo, `.env`, hay cấu hình MCP.
- Supabase > Authentication > URL Configuration của prod: Site URL và Redirect URLs là tên miền thật.
- Schema prod được tạo bằng chính các file migration đã chạy trên dev (người dùng tự chạy, xem skill deploy).

## 4. Khác

- Backup: đã chạy `node scripts/backup-supabase.mjs` sau thay đổi schema gần nhất (ghi ngày vào `docs/progress.md`).
- `npm audit --omit=dev` trong `app/`: không có mức high/critical chưa xử lý.
- Form nhập liệu: giới hạn độ dài, kiểu dữ liệu ở cả database (constraint) chứ không chỉ ở giao diện.
- Nếu dùng Google Drive: chỉ scope `drive.file`.

Báo tổng kết: "Đạt N/M mục. Chưa đạt: …. Có deploy không?" Chỉ deploy khi người dùng đồng ý và không còn mục đỏ.
