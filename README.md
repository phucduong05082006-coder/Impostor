# VAI TRÒ

Bạn là một Senior Frontend Game Developer, chuyên phát triển các trò chơi Party Game bằng HTML5, CSS3 và JavaScript.

Nhiệm vụ của bạn là thiết kế và lập trình hoàn chỉnh một trò chơi có tên **SPY PARTY – AI LÀ GIÁN ĐIỆP**.

Đây là trò chơi suy luận, đánh lừa và tìm kiếm người chơi có vai trò bí mật, dành cho nhóm từ 3–7 người chơi trực tiếp trên cùng một thiết bị.

Yêu cầu quan trọng: Hãy hoàn thành toàn bộ dự án từ giao diện, logic trò chơi, dữ liệu, hiệu ứng, âm thanh, lưu trữ cho đến khả năng cài đặt trên điện thoại. Không được chỉ tạo bản thiết kế hoặc giao diện minh họa.

**Hãy tự triển khai liên tục tất cả các công việc cần thiết cho đến khi dự án hoàn thiện. Không dừng lại để hỏi tôi có muốn chuyển sang giai đoạn tiếp theo hay không. Không chia dự án thành các giai đoạn chờ xác nhận.**

---

# I. CÔNG NGHỆ SỬ DỤNG

Sử dụng:
- HTML5: Xây dựng cấu trúc ứng dụng.
- CSS3: Thiết kế giao diện, animation và responsive.
- JavaScript thuần (Vanilla JavaScript): Xử lý toàn bộ logic trò chơi.
- JSON: Lưu trữ dữ liệu từ khóa.
- LocalStorage: Lưu cài đặt, lịch sử và thống kê.
- PWA: Cho phép cài đặt ứng dụng trên điện thoại.
- Service Worker: Hỗ trợ lưu tài nguyên và chơi offline.

Không sử dụng:
- React, Angular, Vue.
- Backend hoặc server bắt buộc.
- Cơ sở dữ liệu trực tuyến.
- Các thư viện game engine không cần thiết.
- Những thư viện lớn làm ứng dụng nặng và phức tạp.

Ưu tiên JavaScript thuần, code dễ đọc, dễ chỉnh sửa, dễ mở rộng.

---

# II. Ý TƯỞNG VÀ LUẬT CHƠI

Game có 3 vai trò:

## 1. Dân thường (Civilian)
- Nhận được một từ khóa bí mật.
- Những người thuộc phe dân thường có cùng một từ khóa trong chế độ cổ điển.
- Nhiệm vụ là tìm ra gián điệp.
- Khi đưa ra gợi ý, không được nói trực tiếp từ khóa.

## 2. Gián điệp (Spy)
- Không biết từ khóa của dân thường trong chế độ cổ điển.
- Phải dựa vào những gợi ý của người khác để suy luận.
- Phải đưa ra gợi ý sao cho không bị phát hiện.
- Chiến thắng khi đạt điều kiện thắng của phe gián điệp.

## 3. Mr. White
- Không nhận được từ khóa.
- Phải dựa vào gợi ý của mọi người để đoán từ khóa.
- Nếu bị loại, được một cơ hội đoán từ khóa.
- Đoán đúng thì chiến thắng ngay.
- Đoán sai thì bị loại và trò chơi tiếp tục.

## 4. Số lượng người chơi

Hỗ trợ từ 3 đến 7 người.

Cấu hình mặc định:

| Người chơi | Dân thường | Gián điệp | Mr. White |
|---|---:|---:|---:|
| 3 | 2 | 1 | 0 |
| 4 | 3 | 1 | 0 |
| 5 | 4 | 1 | 0 |
| 6 | 4 | 1 | 1 |
| 7 | 5 | 1 | 1 |

Cho phép người chơi tùy chỉnh số lượng vai trò nhưng phải đảm bảo cấu hình hợp lệ.

Không được cho phép bắt đầu nếu:
- Số người chơi dưới 3 hoặc trên 7.
- Không có dân thường.
- Không có gián điệp.
- Tổng số vai trò không bằng số người chơi.
- Cấu hình vai trò không thỏa mãn điều kiện hợp lệ.

## 5. Điều kiện thắng

Phe dân thường:
- Chiến thắng khi toàn bộ gián điệp bị loại.
- Mr. White cũng phải được xử lý theo luật riêng.

Phe gián điệp:
- Chiến thắng khi số gián điệp còn sống lớn hơn hoặc bằng số dân thường còn sống.
- Không tính Mr. White vào điều kiện này.

Mr. White:
- Nếu bị loại, được đoán từ khóa một lần.
- Đoán chính xác sẽ thắng.
- Đoán sai sẽ thua.

Phải kiểm tra điều kiện chiến thắng ngay sau mỗi lần loại người chơi và xử lý đúng thứ tự ưu tiên của các điều kiện thắng.

---

# III. CÁC CHẾ ĐỘ CHƠI

Tạo 3 chế độ chính:

## 1. Classic Mode
- Dân thường cùng nhận một từ khóa.
- Gián điệp không biết từ khóa.
- Mr. White không nhận từ khóa.
- Đây là chế độ mặc định.

## 2. Undercover Mode
- Dân thường và phe đối lập nhận hai từ khóa gần giống nhau.
- Mỗi phe phải tìm ra người thuộc phe còn lại.
- Có thể bật hoặc tắt Mr. White.
- Hệ thống phải lấy từ khóa từ các cặp đã được định nghĩa trong dữ liệu.
- Không được chọn hai từ khóa không liên quan đến nhau.

Ví dụ:
- Cà phê – Trà.
- Chó – Sói.
- Biển – Hồ.
- Bóng đá – Bóng rổ.

## 3. Custom Mode
Cho phép tùy chỉnh:
- Số lượng người chơi.
- Số lượng gián điệp.
- Số lượng Mr. White.
- Chủ đề từ khóa.
- Độ khó.
- Thời gian gợi ý.
- Thời gian thảo luận.
- Có hoặc không sử dụng bỏ phiếu hòa.

---

# IV. QUY TRÌNH MỘT VÁN GAME

Xây dựng đầy đủ quy trình sau:

## Bước 1: Tạo phòng chơi
- Nhập tên từ 3–7 người chơi.
- Thêm, xóa và chỉnh sửa tên.
- Không cho tên trống.
- Có thể tạo tên ngẫu nhiên.
- Cho phép chọn avatar có sẵn.

## Bước 2: Thiết lập trò chơi
- Chọn chế độ chơi.
- Chọn chủ đề.
- Chọn độ khó.
- Chọn vai trò.
- Thiết lập thời gian.
- Hiển thị tóm tắt cấu hình trước khi bắt đầu.

## Bước 3: Phân chia vai trò
- Xáo trộn vai trò bằng cơ chế ngẫu nhiên.
- Gán từ khóa đúng với vai trò.
- Không được phân vai theo thứ tự cố định.
- Không được tiết lộ thông tin bí mật trên giao diện công khai.

## Bước 4: Xem vai trò bí mật

Đây là phần cực kỳ quan trọng.

Thiết kế giao diện chuyển điện thoại lần lượt cho từng người.

Quy trình:
1. Hiển thị tên người chơi hiện tại.
2. Hiển thị thông báo yêu cầu chỉ người đó nhìn màn hình.
3. Có nút "NHẤN ĐỂ XEM VAI TRÒ".
4. Hiển thị vai trò và từ khóa tương ứng.
5. Có nút "TÔI ĐÃ NHỚ".
6. Ẩn toàn bộ thông tin bí mật.
7. Chuyển sang người tiếp theo.

Yêu cầu:
- Không hiển thị thông tin của người trước khi chuyển sang người sau.
- Không có nút quay lại xem vai trò cũ.
- Không để thông tin bí mật xuất hiện trong màn hình tổng quan.
- Có hiệu ứng lật thẻ.
- Có hiệu ứng che thông tin khi xác nhận.

Lưu ý: Đây là cơ chế bảo mật giao diện trên một thiết bị dùng chung, không tuyên bố bảo mật tuyệt đối trước người có quyền truy cập mã nguồn hoặc DevTools.

## Bước 5: Vòng gợi ý

- Hiển thị thứ tự người chơi.
- Mỗi người đưa ra một gợi ý.
- Không được nói trực tiếp từ khóa.
- Có đồng hồ đếm ngược.
- Có nút xác nhận đã gợi ý.
- Đánh dấu người đã hoàn thành.
- Không cho người chơi bị loại tiếp tục tham gia.

## Bước 6: Thảo luận

- Cho phép mọi người thảo luận trực tiếp.
- Có đồng hồ đếm ngược.
- Cho phép chuyển sang bỏ phiếu khi hết thời gian hoặc khi người chơi xác nhận.

## Bước 7: Bỏ phiếu

- Hiển thị danh sách người chơi còn sống.
- Cho phép mỗi người bỏ một phiếu.
- Không được tự bỏ phiếu cho mình.
- Không được bỏ phiếu nhiều lần.
- Người đã bị loại không được bỏ phiếu.
- Không công khai kết quả trước khi tất cả đã bỏ phiếu.
- Sau khi hoàn thành, hiển thị kết quả tổng hợp.

Nếu hòa phiếu:
- Hiển thị những người có số phiếu cao nhất.
- Cho phép thảo luận lại.
- Bỏ phiếu lại giữa những người hòa.
- Nếu vẫn hòa, có thể chọn luật không loại ai trong vòng đó.

## Bước 8: Loại người chơi

- Hiển thị người bị loại.
- Công bố vai trò của người bị loại.
- Cập nhật danh sách người chơi còn sống.
- Nếu là Mr. White, chuyển đến màn hình đoán từ khóa.
- Kiểm tra điều kiện chiến thắng.

## Bước 9: Kết thúc trận đấu

Hiển thị:
- Phe chiến thắng.
- Người chơi thuộc từng phe.
- Vai trò của tất cả người chơi.
- Từ khóa bí mật.
- Số vòng đã chơi.
- Số người bị loại.
- Thống kê phiếu bầu.
- Nút chơi lại.
- Nút về trang chủ.

---

# V. HỆ THỐNG TỪ KHÓA

Tạo kho dữ liệu từ khóa phong phú bằng tiếng Việt.

Các chủ đề tối thiểu:

1. Đồ ăn.
2. Đồ uống.
3. Động vật.
4. Địa điểm.
5. Đồ vật.
6. Nghề nghiệp.
7. Thể thao.
8. Du lịch.
9. Công nghệ.
10. Phim ảnh.
11. Trường học.
12. Giao thông.
13. Thiên nhiên.
14. Nhân vật.
15. Đời sống.

Mỗi chủ đề nên có tối thiểu 30–50 từ khóa phù hợp.

Phân loại độ khó:
- Easy.
- Medium.
- Hard.

Yêu cầu:
- Từ khóa phải quen thuộc, dễ hiểu và phù hợp với người Việt.
- Không chọn trùng từ khóa trong các ván liên tiếp nếu có thể.
- Không chọn từ khóa ngoài chủ đề đã chọn.
- Không để dữ liệu rỗng.
- Có thể bổ sung từ khóa mới.
- Có chức năng tạo bộ từ khóa tùy chỉnh.
- Có thể xóa hoặc chỉnh sửa từ khóa tự tạo.

Trong Undercover Mode, lưu dữ liệu thành các cặp từ có liên quan.

---

# VI. THIẾT KẾ GIAO DIỆN

Đây là yêu cầu có mức độ ưu tiên cao.

Hãy tạo một ứng dụng có giao diện đẹp, chuyên nghiệp, mang phong cách game hiện đại chứ không giống một trang web quản lý thông thường.

Phong cách:
- Dark Modern.
- Mystery / Spy Theme.
- Màu nền đen và tím đậm.
- Màu nhấn tím neon.
- Màu đỏ cho gián điệp.
- Màu xanh cho dân thường.
- Màu trắng hoặc xám cho Mr. White.
- Card bo góc.
- Shadow nhẹ.
- Gradient đẹp.
- Animation mượt.
- Icon đồng bộ.
- Font chữ dễ đọc.

Không lạm dụng hiệu ứng gây rối mắt.

## Các màn hình bắt buộc

### 1. Home Screen
- Logo SPY PARTY.
- Tên game AI LÀ GIÁN ĐIỆP.
- Nút BẮT ĐẦU.
- Nút HƯỚNG DẪN.
- Nút CÀI ĐẶT.
- Nút LỊCH SỬ.

### 2. Player Setup
- Danh sách người chơi.
- Avatar.
- Tên người chơi.
- Nút thêm và xóa.
- Bộ đếm số lượng người chơi.

### 3. Game Setup
- Chọn chế độ.
- Chọn số lượng vai trò.
- Chọn chủ đề.
- Chọn độ khó.
- Chọn thời gian.
- Nút bắt đầu.

### 4. Role Reveal
- Thẻ bí mật.
- Hiệu ứng lật thẻ.
- Hiệu ứng hiện vai trò.
- Nút xác nhận.
- Giao diện che thông tin.

### 5. Game Screen
- Danh sách người chơi còn sống.
- Thứ tự gợi ý.
- Đồng hồ.
- Số vòng.
- Trạng thái từng người.

### 6. Voting Screen
- Danh sách người chơi.
- Avatar.
- Nút chọn người nghi ngờ.
- Hiệu ứng xác nhận.
- Thanh tiến độ bỏ phiếu.

### 7. Result Screen
- Hiệu ứng chiến thắng.
- Hiển thị phe thắng.
- Danh sách vai trò.
- Thống kê trận đấu.
- Nút chơi lại.

### 8. Settings
- Bật/tắt âm thanh.
- Bật/tắt rung nếu thiết bị hỗ trợ.
- Điều chỉnh âm lượng.
- Cài đặt hiệu ứng.
- Quản lý từ khóa.
- Cài đặt thời gian.

---

# VII. ÂM THANH VÀ HIỆU ỨNG

Bổ sung các hiệu ứng:
- Nhấn nút.
- Chuyển màn hình.
- Lật thẻ.
- Hiện vai trò.
- Đếm ngược.
- Bỏ phiếu.
- Loại người chơi.
- Chiến thắng.
- Thất bại.

Có thể sử dụng Web Audio API hoặc file âm thanh nội bộ.

Yêu cầu:
- Không tự động phát âm thanh lớn khi mở ứng dụng.
- Có thể tắt toàn bộ âm thanh.
- Không làm chậm trò chơi.
- Không phụ thuộc vào nguồn âm thanh trực tuyến.

---

# VIII. LƯU TRỮ VÀ THỐNG KÊ

Sử dụng LocalStorage để lưu:
- Cài đặt người chơi.
- Tên người chơi gần nhất.
- Tùy chọn giao diện.
- Âm thanh.
- Bộ từ khóa tự tạo.
- Lịch sử các trận đấu.
- Thống kê thắng/thua.

Thống kê:
- Tổng số trận.
- Số lần thắng phe dân thường.
- Số lần thắng gián điệp.
- Số lần thắng Mr. White.
- Số lần được phân vào từng vai trò.
- Tỷ lệ chiến thắng.

Phải có cơ chế kiểm tra dữ liệu LocalStorage trước khi sử dụng và xử lý dữ liệu lỗi hoặc thiếu.

---

# IX. PWA VÀ HỖ TRỢ ĐIỆN THOẠI

Ứng dụng phải có khả năng cài đặt trên Android và iOS thông qua trình duyệt hỗ trợ.

Tạo:
- manifest.json.
- service-worker.js.
- Icon ứng dụng.
- Splash screen phù hợp.
- Tên ứng dụng.
- Màu giao diện.
- Hỗ trợ màn hình dọc và ngang.

Yêu cầu:
- Responsive trên điện thoại, tablet và desktop.
- Ưu tiên thiết kế Mobile First.
- Các nút đủ lớn để chạm.
- Không xuất hiện thanh cuộn ngang.
- Không bị vỡ giao diện ở màn hình nhỏ.
- Chạy được offline sau lần tải tài nguyên cần thiết.
- Không phụ thuộc CDN khi sử dụng offline.

Lưu ý: PWA cần được triển khai trên HTTPS hoặc localhost để cài đặt và sử dụng Service Worker đúng cách. Không được tuyên bố có thể tạo APK Android gốc chỉ bằng HTML. Nếu cần APK, hãy cung cấp hướng dẫn đóng gói riêng bằng một giải pháp phù hợp như Capacitor.

---

# X. KIẾN TRÚC SOURCE CODE

Tổ chức dự án rõ ràng:

SpyParty/
│
├── index.html
│
├── css/
│   ├── style.css
│   ├── home.css
│   ├── game.css
│   ├── components.css
│   └── responsive.css
│
├── js/
│   ├── app.js
│   ├── game.js
│   ├── player.js
│   ├── roles.js
│   ├── voting.js
│   ├── scoring.js
│   ├── wordBank.js
│   ├── storage.js
│   └── audio.js
│
├── data/
│   ├── words.json
│   └── wordPairs.json
│
├── assets/
│   ├── icons/
│   ├── images/
│   └── sounds/
│
├── manifest.json
├── service-worker.js
└── README.md

Có thể điều chỉnh cấu trúc nếu cần, nhưng phải giữ nguyên nguyên tắc phân chia chức năng.

Yêu cầu code:
- Tên biến và hàm rõ nghĩa.
- Hàm không nên quá dài.
- Không viết toàn bộ logic vào một file.
- Không lặp code không cần thiết.
- Có chú thích ở những đoạn logic quan trọng.
- Không để code giả, TODO hoặc chức năng chỉ có giao diện mà không hoạt động.
- Không sử dụng dữ liệu giả để thay thế các chức năng thật.

---

# XI. CÁC YÊU CẦU VỀ LOGIC VÀ KIỂM THỬ

Trước khi hoàn thành phải kiểm tra các tình huống:

1. Game với 3 người.
2. Game với 4 người.
3. Game với 5 người.
4. Game với 6 người.
5. Game với 7 người.
6. Phân chia vai trò ngẫu nhiên.
7. Không trùng vai trò sai cấu hình.
8. Không lộ từ khóa của dân thường cho gián điệp.
9. Không lộ từ khóa cho Mr. White.
10. Không cho bỏ phiếu nhiều lần.
11. Không cho người đã bị loại tham gia.
12. Xử lý hòa phiếu.
13. Xử lý Mr. White đoán từ khóa.
14. Xử lý điều kiện thắng của từng phe.
15. Chơi lại không giữ dữ liệu bí mật của ván trước.
16. Kiểm tra LocalStorage.
17. Kiểm tra responsive.
18. Kiểm tra chế độ offline.
19. Kiểm tra lỗi JavaScript trong Console.
20. Kiểm tra không có nút bấm nào bị vô hiệu hoặc không có chức năng.

Đặc biệt, hãy xây dựng logic trò chơi độc lập với giao diện để dễ kiểm thử.

---

# XII. QUY TRÌNH THỰC HIỆN VÀ TIÊU CHUẨN HOÀN THÀNH

Bạn phải tự thực hiện liên tục theo trình tự hợp lý:

1. Phân tích kiến trúc dự án.
2. Tạo đầy đủ cấu trúc thư mục.
3. Xây dựng dữ liệu từ khóa.
4. Lập trình logic trò chơi.
5. Lập trình giao diện.
6. Kết nối toàn bộ giao diện với logic.
7. Bổ sung hiệu ứng và âm thanh.
8. Xây dựng LocalStorage.
9. Xây dựng PWA.
10. Kiểm tra và sửa lỗi.
11. Viết README hướng dẫn sử dụng và triển khai.

Không được dừng lại sau khi tạo xong giao diện.

Không được chỉ trả về một vài đoạn code mẫu.

Không được bỏ trống những file quan trọng.

Không được tự ý loại bỏ những tính năng đã yêu cầu để rút ngắn thời gian.

Nếu gặp vấn đề kỹ thuật, hãy tự tìm phương án thay thế phù hợp và tiếp tục hoàn thiện dự án.

Nếu môi trường cho phép chạy lệnh, hãy chạy ứng dụng và kiểm tra thực tế. Nếu có công cụ kiểm thử trình duyệt, hãy kiểm tra các luồng chơi chính.

## TIÊU CHUẨN BÀN GIAO CUỐI CÙNG

Khi hoàn thành, phải đảm bảo:

- Game có thể chơi trọn vẹn từ đầu đến cuối.
- Hỗ trợ 3–7 người.
- Các vai trò được phân chia chính xác.
- Không có lỗi logic nghiêm trọng.
- Giao diện đẹp và chuyên nghiệp.
- Hoạt động tốt trên điện thoại và máy tính.
- Có thể chơi offline sau khi cài đặt tài nguyên.
- Có thể cài đặt PWA.
- Có hướng dẫn chạy trong VS Code.
- Có hướng dẫn triển khai lên GitHub Pages hoặc một nền tảng hosting HTTPS.
- Có hướng dẫn đóng gói APK nếu người dùng muốn phát triển phiên bản Android.

**Mục tiêu cuối cùng: Tạo ra một sản phẩm SPY PARTY hoàn chỉnh, có thể sử dụng thực tế để một nhóm bạn mở ứng dụng trên điện thoại, nhập tên, phân chia vai trò, chơi, bỏ phiếu, tìm gián điệp và kết thúc trận đấu mà không cần sự can thiệp của lập trình viên.**# SPY PARTY – AI LÀ GIÁN ĐIỆP 🕵️‍♂️🎭

**SPY PARTY** là một Party Game suy luận, đánh lừa và tìm kiếm kẻ ẩn danh dành cho nhóm từ **3 đến 7 người chơi trực tiếp trên cùng một điện thoại**. 

Ứng dụng được thiết kế theo phong cách **Dark Modern / Cyberpunk Neon**, tối ưu trải nghiệm chạm vuốt trên di động (Mobile First), hoạt động mượt mà 100% offline, bảo mật giao diện xem vai trò bí mật và tích hợp chuẩn PWA cho phép cài đặt trực tiếp lên màn hình chính của Android và iOS.

---

## 🌟 TÍNH NĂNG NỔI BẬT

1. **Chơi trên một thiết bị (Pass-and-Play):**
   - Không cần mạng Internet, không cần mỗi người một máy.
   - Cơ chế bảo mật giao diện: Chuyển máy lần lượt, màn hình che thông tin, thẻ bài 3D lật úp/mở sinh động, nút xác nhận "Tôi đã nhớ - Che lại" chống nhìn trộm.

2. **3 Vai Trò Cốt Lõi:**
   - 🛡️ **Dân Thường (Civilian):** Nắm giữ từ khóa bí mật, đưa ra gợi ý khéo léo để nhận diện đồng đội và vote loại gián điệp.
   - 🕵️ **Gián Điệp (Spy):** Không biết từ khóa (Cổ điển) hoặc nhận từ khóa tương đồng (Undercover), phải suy luận từ gợi ý của người khác để ngụy trang và sống sót.
   - 👤 **Mr. White:** Hoàn toàn không có từ khóa! Nếu bị vote loại, có **1 cơ hội duy nhất** để đoán từ khóa của dân thường: Đoán đúng sẽ **LẬT KÈO THẮNG NGAY LẬP TỨC**!

3. **3 Chế Độ Chơi Hấp Dẫn:**
   - 🎭 **Cổ Điển (Classic):** Dân thường chung một từ khóa, Gián điệp và Mr. White không có từ khóa.
   - 🕵️ **Điệp Viên (Undercover):** Dân thường và Gián điệp nhận 2 từ khóa gần giống nhau (Ví dụ: *Cà phê – Trà sữa*, *Phở bò – Bún bò Huế*, *Chó – Sói*).
   - ⚡ **Tùy Chỉnh (Custom):** Tự do thiết lập số lượng từng vai trò, chủ đề từ khóa, độ khó, thời gian đếm ngược và luật hòa phiếu.

4. **Kho Dữ Liệu Từ Vựng Thuần Việt Phong Phú:**
   - Hơn 500+ từ khóa trải dài trên 15 chủ đề: *Đồ ăn, Đồ uống, Động vật, Địa điểm, Đồ vật, Nghề nghiệp, Thể thao, Du lịch, Công nghệ, Phim ảnh, Trường học, Giao thông, Thiên nhiên, Nhân vật, Đời sống*.
   - Phân loại 3 cấp độ: Dễ (Easy), Trung bình (Medium), Khó (Hard).
   - Cơ chế ghi nhớ chống lặp từ trong các ván liên tiếp.
   - Cho phép người chơi tự tạo và quản lý bộ từ khóa riêng trong phần Cài đặt.

5. **Hệ Thống Âm Thanh & Rung (Web Audio API & Haptics):**
   - 100% tự sinh âm thanh bằng Web Audio API nội bộ (tiếng lật thẻ, âm thanh dramatic khi hiện vai trò, tiếng đếm ngược, tiếng nổ boom khi loại người, nhạc chiến thắng).
   - Không phụ thuộc vào file nhạc tải từ Internet, không lo lỗi mạng khi offline.
   - Hỗ trợ rung phản hồi xúc giác (Haptic Vibration) trên điện thoại di động.

6. **Lưu Trữ & Thống Kê (LocalStorage):**
   - Lưu trữ danh sách người chơi gần nhất, tùy chọn âm thanh, thời gian.
   - Ghi lại lịch sử 30 trận đấu gần nhất và thống kê tỷ lệ thắng của từng phe.

7. **PWA (Progressive Web App):**
   - Hỗ trợ cài đặt lên màn hình chính (Add to Home Screen) trên cả Android & iOS.
   - Service Worker lưu bộ nhớ đệm (Cache), chơi offline mượt mà không cần mạng.

---

## 📁 CẤU TRÚC DỰ ÁN

```
SpyParty/
│
├── index.html              # Giao diện chính và các màn hình ứng dụng
├── manifest.json           # Cấu hình PWA cài đặt ứng dụng
├── service-worker.js       # Bộ đệm offline Service Worker
├── README.md               # Hướng dẫn chi tiết
│
├── css/
│   ├── style.css           # Biến màu sắc, Typography, Reset, Layout container
│   ├── components.css      # Nút bấm, Card, Avatar, Timer, Modals, Toasts
│   ├── home.css            # Màn hình Home, Luật chơi, Thống kê
│   ├── game.css            # Thẻ bài 3D, Vòng gợi ý, Bỏ phiếu kín, Kết thúc
│   └── responsive.css      # Tối ưu di động, Safe-area insets cho tai thỏ
│
├── js/
│   ├── storage.js          # Quản lý LocalStorage an toàn & dự phòng
│   ├── audio.js            # Bộ sinh âm thanh Web Audio API & Rung Haptic
│   ├── wordBank.js         # Quản lý kho từ vựng tiếng Việt & cặp từ Undercover
│   ├── roles.js            # Định nghĩa vai trò & thuật toán xáo trộn Fisher-Yates
│   ├── player.js           # Quản lý danh sách người chơi, avatar & tên ngẫu nhiên
│   ├── voting.js           # Cơ chế bỏ phiếu kín luân phiên & xử lý hòa phiếu
│   ├── scoring.js          # Thẩm định điều kiện thắng & Mr. White đoán từ
│   ├── game.js             # Máy trạng thái trò chơi (State Machine) & Timer
│   └── app.js              # Controller điều phối toàn bộ sự kiện và giao diện
│
├── data/
│   ├── words.json          # Bộ 500+ từ khóa 15 chủ đề tiếng Việt
│   └── wordPairs.json      # Danh sách các cặp từ tương đồng Undercover
│
└── assets/
    └── icons/              # Biểu tượng PWA (icon.svg, icon-192.png, icon-512.png)
```

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & CHẠY ỨNG DỤNG

### Cách 1: Chạy bằng Visual Studio Code (Khuyên dùng)
1. Mở thư mục dự án trong **VS Code**.
2. Cài đặt tiện ích mở rộng **Live Server** (của *Ritwick Dey*).
3. Nhấp chuột phải vào file `index.html` và chọn **Open with Live Server**.
4. Trình duyệt sẽ mở ứng dụng tại địa chỉ `http://127.0.0.1:5500`.

### Cách 2: Mở trực tiếp file `index.html`
- Do hệ thống đã tích hợp sẵn dữ liệu dự phòng (fallback data) trong `wordBank.js` và âm thanh tổng hợp từ Web Audio API, bạn có thể nhấp đúp trực tiếp vào `index.html` để chơi ngay trên Chrome, Edge, Safari hoặc Firefox mà không cần chạy web server!

---

## 🌐 HƯỚNG DẪN TRIỂN KHAI LÊN GITHUB PAGES / HOSTING HTTPS

Để tận dụng đầy đủ tính năng PWA (cài đặt lên điện thoại và Service Worker), bạn nên đưa ứng dụng lên một máy chủ hỗ trợ giao thức **HTTPS**.

### Triển khai lên GitHub Pages:
1. Đẩy mã nguồn lên một repository mới trên GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit Spy Party game"
   git branch -M main
   git remote add origin https://github.com/<tai-khoan-cua-ban>/spy-party.git
   git push -u origin main
   ```
2. Trên GitHub, vào mục **Settings** của repository -> chọn thẻ **Pages**.
3. Tại mục **Branch**, chọn `main` và thư mục `/ (root)`, sau đó bấm **Save**.
4. Chờ 1–2 phút, bạn sẽ nhận được đường dẫn dạng: `https://<tai-khoan>.github.io/spy-party/`.
5. Mở liên kết trên điện thoại, chọn **Thêm vào màn hình chính** (Add to Home Screen) để sử dụng như một ứng dụng độc lập!

---

## 📱 HƯỚNG DẪN ĐÓNG GÓI THÀNH FILE APK ANDROID (BẰNG CAPACITOR)

Nếu bạn muốn tạo file cài đặt `.apk` cho hệ điều hành Android:

1. **Chuẩn bị môi trường:**
   - Cài đặt [Node.js](https://nodejs.org/).
   - Cài đặt [Android Studio](https://developer.android.com/studio).

2. **Khởi tạo Capacitor trong thư mục dự án:**
   ```bash
   npm init -y
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init "Spy Party" "com.spyparty.game" --web-dir "."
   ```

3. **Thêm nền tảng Android:**
   ```bash
   npx cap add android
   npx cap sync
   ```

4. **Mở dự án trong Android Studio:**
   ```bash
   npx cap open android
   ```

5. **Xuất file APK:**
   - Trong Android Studio, vào menu **Build** -> chọn **Build Bundle(s) / APK(s)** -> chọn **Build APK(s)**.
   - File APK tạo ra có thể cài đặt trực tiếp lên mọi điện thoại Android!

---

## 🎮 LUẬT CHƠI CHI TIẾT DÀNH CHO NGƯỜI CHƠI MỚI

1. **Bắt đầu:** Nhập tên từ 3 đến 7 người chơi (có thể đổi avatar hoặc nhấn xúc xắc 🎲 để lấy mật danh điệp viên).
2. **Xem vai trò bí mật:** Chuyển điện thoại lần lượt cho từng người. Người chơi chạm để lật thẻ xem vai trò và từ khóa bí mật của mình, sau đó nhấn "Tôi đã nhớ - Che lại" trước khi chuyển máy cho người tiếp theo.
3. **Vòng gợi ý:** Lần lượt từng người đưa ra 1 gợi ý ngắn gọn về từ khóa của mình (không được nói thẳng từ khóa).
4. **Thảo luận:** Cả nhóm có thời gian tranh luận tự do để phát hiện người có gợi ý khả nghi nhất.
5. **Bỏ phiếu kín:** Lần lượt từng người cầm máy, chọn một người mình nghi ngờ là Gián điệp và xác nhận.
6. **Xử lý:**
   - Người có số phiếu cao nhất sẽ bị loại và công bố thân phận.
   - Nếu người bị loại là **Mr. White**, họ được 1 cơ hội duy nhất để đoán từ khóa của phe Dân thường. Nếu đoán đúng, Mr. White giành chiến thắng lập tức!
   - Nếu hòa phiếu, hệ thống cho phép bỏ phiếu lại giữa những người hòa hoặc bỏ qua không loại ai vòng đó.
7. **Chiến thắng:**
   - Dân thường thắng khi diệt sạch Gián điệp.
   - Gián điệp thắng khi số gián điệp sống bằng hoặc vượt số dân thường.

---

Chúc bạn và nhóm bạn có những giây phút đấu trí, lừa gạt và cười thả ga cùng **SPY PARTY**! 🕵️🎉
