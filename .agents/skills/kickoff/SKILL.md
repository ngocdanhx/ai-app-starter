---
name: kickoff
description: Bắt đầu dự án mới hay khi docs/brief.md còn "TRẠNG THÁI: CHƯA ĐIỀN": hỏi ý định, đề xuất giải pháp và chi phí, chờ đồng ý, rồi lập plan theo mốc. Không viết code trong skill này.
---

# Kickoff: từ ý tưởng tới plan

Không tạo project, không cài gói, không viết code cho tới khi xong bước 3 và người dùng đồng ý plan.

## 1. Hỏi (một lượt, tối đa 5 câu)

Mỗi câu kèm 2–4 lựa chọn đánh số và "khác: …". Chỉ hỏi điều làm thay đổi giải pháp. Ví dụ cho app ghi chi tiêu:

1. Ai dùng? (a) chỉ mình bạn (b) gia đình, vài người (c) người lạ, có thể thu tiền
2. Cần đăng nhập? (a) không, chỉ một máy (b) email + mật khẩu (c) đăng nhập Google
3. Ghi gì cho mỗi khoản? (a) số tiền + ghi chú (b) thêm danh mục, ngày (c) thêm ảnh hoá đơn
4. Xem lại thế nào? (a) danh sách (b) tổng theo tháng (c) biểu đồ theo danh mục
5. Dùng ở đâu? (a) điện thoại (b) máy tính (c) cả hai

Nhận câu trả lời rồi ghi `docs/brief.md`, xoá dòng `TRẠNG THÁI: CHƯA ĐIỀN`. Câu trả lời mơ hồ thì tự chọn
phương án đơn giản nhất và ghi rõ "giả định" trong brief.

## 2. Đề xuất

Viết ngắn, lời thường:
- App gồm những phần nào (màn hình, dữ liệu, đăng nhập).
- Dịch vụ dùng (theo stack mặc định trong AGENTS.md) và vì sao; dịch vụ nào chưa cần thì nói "chưa cần".
- Chi phí: bao nhiêu là free, tới mốc nào phải trả, trả bao nhiêu/tháng. App có thu tiền thì không dùng
  Vercel Hobby. Có file lớn thì nói về R2 (cần thông tin thanh toán).
- Tài khoản cần tạo: GitHub, Supabase (2 project dev + prod), Cloudflare; tạo lúc nào.
- Rủi ro chính và cách tránh.

Kết thúc: "Bạn đồng ý hướng này không? Muốn đổi chỗ nào?". Chỉ khi người dùng đồng ý mới ghi
`docs/decisions.md`.

## 3. Plan

Ghi `docs/plan.md`: 4–8 mốc, mỗi mốc 1 dòng việc + 1 dòng "Kiểm:" mô tả cách mở ra xem. Gợi ý thứ tự:
khung app chạy local → giao diện với dữ liệu giả → database dev + RLS → đăng nhập → tính năng chính →
kiểm bảo mật → deploy. Hỏi "Bắt đầu mốc 1 nhé?" rồi mới làm.
