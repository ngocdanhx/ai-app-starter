---
name: deploy-cloudflare-pages
description: Đưa app React/Vite trong thư mục app/ lên Cloudflare Pages qua kết nối GitHub, kèm env prod và đưa schema lên Supabase prod. Chỉ chạy sau security-check và khi người dùng đồng ý.
---

# Deploy lên Cloudflare Pages

Điều kiện: `security-check` đạt hết; người dùng đã nói đồng ý deploy. Đây là bước đưa ra công khai.

## Lần đầu (người dùng bấm trên web, agent hướng dẫn từng bước)

1. Code đã commit. Hỏi người dùng rồi mới `git push` lên GitHub.
2. Mở https://dash.cloudflare.com > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
   Chọn repo của dự án. (Giao diện Cloudflare đổi thường xuyên: tên nút khác thì tìm mục "Pages" và "Git".)
3. Build settings:
   - Framework preset: **React (Vite)**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `app`
4. Environment variables (Production): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` của project **prod**.
   Người dùng tự dán giá trị. Không đặt secret key ở đây (biến `VITE_*` lộ ra trình duyệt).
5. **Save and Deploy**. Xong sẽ có link `https://<tên>.pages.dev`.
6. Supabase prod > Authentication > URL Configuration: thêm link `pages.dev` (và tên miền riêng nếu có).

App một trang (React Router): Pages tự trả `index.html` cho mọi đường dẫn khi project không có `404.html`
ở gốc, nên không cần cấu hình thêm.

## Đưa schema lên Supabase prod

Agent không chạm prod và không `link` project prod (link sẽ làm mọi lệnh `supabase` sau đó trỏ vào prod).
Chỉ một cách: người dùng tự chạy trong cửa sổ PowerShell của họ, đưa thẳng connection string prod vào lệnh:

```powershell
$env:SUPABASE_PROD_DB_URL = "postgresql://..."   # Supabase prod > Connect > Session pooler; chỉ sống trong cửa sổ này
node scripts/backup-supabase.mjs --prod           # 1. sao lưu prod trước
npx supabase@2.122.1 db push --db-url $env:SUPABASE_PROD_DB_URL --dry-run   # 2. xem migration nào sẽ chạy
npx supabase@2.122.1 db push --db-url $env:SUPABASE_PROD_DB_URL             # 3. chạy thật
Remove-Item Env:SUPABASE_PROD_DB_URL
```

Không dán SQL migration vào SQL Editor của prod: cách đó không ghi lịch sử migration, lần `db push` sau sẽ chạy
lại từ đầu và lỗi. Supabase CLI từ bản 3.0 đổi `--db-url` thành `--remote=<url>`; dùng bản khác 2.122.1 thì kiểm
`npx supabase db push --help` trước.

Sau đó chạy lại phần SQL kiểm RLS của security-check trên prod.

## Các lần sau

Mỗi `git push` lên nhánh chính sẽ tự build và deploy lại, nên push = deploy: luôn hỏi trước.
Build lỗi: Cloudflare > dự án > Deployments > bản lỗi > View build log; chép đoạn lỗi cho agent.
Quay về bản trước: Deployments > bản cũ > **Rollback**.

Giới hạn free (kiểm 04/11/2026): 500 lần build/tháng. Nguồn: https://developers.cloudflare.com/pages/platform/limits/
