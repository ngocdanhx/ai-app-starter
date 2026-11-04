---
name: backup-supabase
description: Sao lưu database Supabase (vai trò, schema, dữ liệu) ra thư mục backups/ bằng scripts/backup-supabase.mjs, và thử phục hồi vào project dev. Dùng sau mỗi thay đổi schema, trước deploy, và hằng tuần.
---

# Backup Supabase

Gói Free không có backup tự động. Script này dump database theo hướng dẫn chính thức
(https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).

## Cần có

- Docker Desktop đang chạy (Supabase CLI chạy `pg_dump` trong container).
- Dòng `SUPABASE_DEV_DB_URL=...` trong `.env` (Supabase > nút **Connect** > **Session pooler**; mật khẩu
  database đặt ở Project Settings > Database). Ký tự đặc biệt trong mật khẩu phải mã hoá (`@` thành `%40`).

## Chạy

```
node scripts/backup-supabase.mjs --dry-run   # xem lệnh sẽ chạy, mật khẩu được che
node scripts/backup-supabase.mjs             # tạo backups/<ngày_giờ>-dev/{roles,schema,data}.sql
```

Agent được chạy cho **dev**. Bản **prod** do người dùng tự chạy trong PowerShell của họ:

```powershell
$env:SUPABASE_PROD_DB_URL = "postgresql://..."   # chỉ sống trong cửa sổ này
node scripts/backup-supabase.mjs --prod
Remove-Item Env:SUPABASE_PROD_DB_URL
```

Sau khi chạy: nhắc người dùng chép thư mục `backups/...` ra chỗ an toàn (ổ ngoài, Drive cá nhân), không commit
(đã có trong `.gitignore`), ghi ngày vào `docs/progress.md`.

## Không có trong bản sao lưu

File trong Supabase Storage (chỉ có dòng metadata), code Edge Functions, cấu hình project (Auth URL, key).
App có file quan trọng thì tải về định kỳ từ dashboard hay viết script riêng.

## Thử phục hồi (trên một project dev trống, không bao giờ trên prod)

Theo mục "Restore backup using CLI" của trang hướng dẫn trên: cần `psql` (cài PostgreSQL client), rồi người dùng
chạy `psql` với connection string của project trống, lần lượt `roles.sql`, `schema.sql`, `data.sql`.
Thử ít nhất một lần để biết bản sao lưu dùng được.
