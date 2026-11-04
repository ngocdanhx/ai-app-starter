---
name: kickoff
description: Bắt đầu dự án mới hay khi docs/brief.md còn "TRẠNG THÁI: CHƯA ĐIỀN": hỏi ý định, đề xuất kiến trúc kèm lý do kỹ thuật và chi phí, chờ đồng ý, rồi lập plan theo mốc. Không viết code trong skill này.
---

# Kickoff: từ ý tưởng tới plan

Không tạo project, không cài gói, không viết code cho tới khi xong bước 3 và người dùng đồng ý plan.
Người dùng là sinh viên IT biết web cơ bản: nói bằng thuật ngữ đúng, không giảng git/npm/component.

## 1. Hỏi (một lượt, tối đa 6 câu)

Mỗi câu kèm 2–4 lựa chọn đánh chữ và "khác: …". Chỉ hỏi điều làm thay đổi giải pháp. Ví dụ cho app ghi chi tiêu:

1. Ai dùng? (a) chỉ mình bạn (b) gia đình, vài người (c) người lạ, có thể thu tiền
2. Đăng nhập? (a) không, dữ liệu ở localStorage một máy (b) email + mật khẩu (Supabase Auth) (c) Google OAuth
3. Ghi gì cho mỗi khoản? (a) số tiền + ghi chú (b) thêm danh mục, ngày (c) thêm ảnh hoá đơn (cần Storage)
4. Xem lại thế nào? (a) danh sách (b) tổng theo tháng (c) biểu đồ theo danh mục
5. Dùng ở đâu? (a) điện thoại (b) máy tính (c) cả hai
6. Cách làm? (a) agent làm hết, mình đọc lại (b) mình tự viết giao diện, agent lo database/auth
   (c) mình tự viết query + RLS policy, agent lo phần còn lại (d) khác: …

Nhận câu trả lời rồi ghi `docs/brief.md`, xoá dòng `TRẠNG THÁI: CHƯA ĐIỀN`. Câu trả lời mơ hồ thì tự chọn
phương án đơn giản nhất và ghi rõ "giả định" trong brief.

## 2. Đề xuất

Viết ngắn, có cấu trúc:
- Kiến trúc: các trang/màn hình, bảng dữ liệu (cột chính), auth, dữ liệu đi từ đâu tới đâu.
- Stack (theo mặc định trong AGENTS.md). Mỗi lựa chọn chính một câu lý do kỹ thuật và đánh đổi so với
  phương án thay thế, vd: Vite SPA thay vì Next.js (không cần SSR, deploy tĩnh đơn giản; đổi lại SEO kém hơn);
  gọi Supabase thẳng từ frontend + RLS thay vì tự viết API (ít code; đổi lại an toàn dựa hết vào policy).
  Dịch vụ nào chưa cần thì nói "chưa cần".
- Chi phí: bao nhiêu là free, tới mốc nào phải trả, trả bao nhiêu/tháng. App có thu tiền thì không dùng
  Vercel Hobby. Có file lớn thì nói về R2 (cần thông tin thanh toán). Supabase Free tự pause, không backup.
- Tài khoản cần tạo: GitHub, Supabase (2 project dev + prod), Cloudflare; tạo lúc nào.
- Rủi ro chính và cách tránh.
- Nếu người dùng muốn tự viết một phần: nói phần đó nằm ở mốc nào, cần biết gì trước.

Kết thúc: "Bạn đồng ý hướng này không? Muốn đổi chỗ nào?". Chỉ khi người dùng đồng ý mới ghi
`docs/decisions.md`.

## 3. Plan

Ghi `docs/plan.md`: 4–8 mốc, mỗi mốc 1 dòng việc + 1 dòng "Kiểm:" mô tả cách mở ra xem. Đánh dấu mốc nào
người dùng tự viết. Gợi ý thứ tự: khung app chạy local → giao diện với dữ liệu giả → database dev + migration
+ RLS → auth → tính năng chính → security-check → deploy. Hỏi "Bắt đầu mốc 1 nhé?" rồi mới làm.
