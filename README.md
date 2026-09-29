<div align="center">

<img src="icons/icon128.png" alt="Floating Quick Note Logo" width="88" height="88" />

# Floating Quick Note

**Tiện ích ghi chú nổi thông minh, mượt mà và giàu tính năng cho trình duyệt Chromium (Chrome, Edge, Brave, Arc)**  
*Smart, fluid, and feature-rich floating notes extension for Chromium browsers*

[![Version](https://img.shields.io/badge/version-v1.0.0-eba825?style=for-the-badge)](https://github.com/diepvantien/Floating-Quick-Note/releases)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-259fd1?style=for-the-badge)](manifest.json)
[![Language](https://img.shields.io/badge/Language-VI%20%7C%20EN-5c996b?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/License-MIT%20(Personal%20Use)-8496ff?style=for-the-badge)](#giấy-phép--license)

<p align="center">
  <a href="https://github.com/diepvantien/Floating-Quick-Note/archive/refs/heads/main.zip">
    <img src="https://img.shields.io/badge/⬇_Tải_Xuống_(Download_ZIP)-v1.0.0-1f1a14?style=for-the-badge&logo=github&logoColor=ffd86b" alt="Download ZIP" />
  </a>
  <a href="https://github.com/diepvantien/Floating-Quick-Note/releases">
    <img src="https://img.shields.io/badge/📦_Releases-GitHub-2d333b?style=for-the-badge&logo=github" alt="GitHub Releases" />
  </a>
</p>

<p align="center">
  <a href="https://me.momo.vn/OeIGiJsViJfDfntmiRId" target="_blank">
    <img src="https://img.shields.io/badge/MoMo-Ủng_hộ_(Donate)-d82d8b?style=flat-square&logo=heart&logoColor=white" alt="Donate via MoMo" />
  </a>
  <a href="https://buymeacoffee.com/tixuno" target="_blank">
    <img src="https://img.shields.io/badge/Buy_Me_a_Coffee-Support-FFDD00?style=flat-square&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me a Coffee" />
  </a>
</p>

</div>

---

## ✨ Giới thiệu (Overview)

**Floating Quick Note** giúp bạn ghi chú tức thì ngay trên bất kỳ trang web nào mà không cần chuyển tab hay rời khỏi luồng công việc hiện tại. Tiện ích kết hợp giữa **bong bóng nổi thu gọn (Floating Bubble)** và **cửa sổ soạn thảo đa năng (Popup Note)** với chuyển động thu phóng mượt mà, hỗ trợ dán/kéo thả hình ảnh, lưu lịch sử chỉnh sửa tự động và đồng bộ thời gian thực giữa mọi tab.

---

## 🚀 Tính năng nổi bật (Key Features)

### 1. Cửa sổ nổi & Bong bóng thông minh (Fluid Bubble ↔ Popup)
- **Hiệu ứng thu phóng mượt mà**: Chuyển đổi liền mạch giữa bong bóng thu gọn (`56×56px`) và cửa sổ ghi chú theo quỹ đạo vật lý (GPU-composited FLIP morph animation).
- **Kéo thả & Đổi kích thước tự do**: Tự động ghi nhớ vị trí bong bóng, vị trí cửa sổ và kích thước khung soạn thảo theo tỷ lệ màn hình.
- **Cô lập bằng Shadow DOM**: Giao diện hoàn toàn độc lập, không bao giờ xung đột CSS với trang web bạn đang truy cập.
- **Chế độ cửa sổ độc lập (`standalone.html`)**: Tự động mở cửa sổ popup riêng khi bạn gọi ghi chú trên các trang hệ thống bị trình duyệt giới hạn (`chrome://`, `edge://`, Web Store...).

### 2. Soạn thảo văn bản & Xử lý hình ảnh nâng cao (Rich Text & Image Tools)
- **Đa phương thức chèn nội dung**:
  - Gõ văn bản trực tiếp hoặc dán từ Clipboard (`Ctrl+V` / `Cmd+V`).
  - Kéo & thả hình ảnh từ máy tính hoặc từ trang web bất kỳ thẳng vào khung ghi chú.
  - Menu chuột phải tiện lợi: *"Thêm văn bản đã chọn vào Floating Quick Note"* và *"Thêm ảnh vào Floating Quick Note"*.
- **Lưu trữ ảnh Offline bền vững**: Tự động chuyển đổi ảnh từ liên kết ngoài sang định dạng `Data URL` để hiển thị ngay cả khi mất kết nối mạng.
- **Thanh công cụ ảnh trực quan (Image HUD & Lightbox)**:
  - Phóng to / thu nhỏ ảnh (`+` / `−` hoặc giữ `Ctrl/Cmd/Alt + Cuộn chuột`), kéo góc ảnh để thay đổi kích thước, hoặc đưa về chuẩn vừa khung (`100%`).
  - Sao chép riêng từng ảnh vào Clipboard hoặc xóa nhanh ảnh.
  - Nhấp đúp (Double-click) hoặc nhấn `Enter` khi chọn ảnh để mở chế độ **Lightbox** xem ảnh chi tiết (hỗ trợ cuộn để zoom lên tới `500%` và kéo để di chuyển).
- **Sao chép toàn bộ ghi chú**: Nút Copy góc phải trình soạn thảo cho phép sao chép đồng thời cả văn bản và hình ảnh trong ghi chú.

### 3. Quản lý đa ghi chú, Tìm kiếm & Lịch sử (Multi-Note, Search & History)
- **Nhiều ghi chú**: Tạo, chuyển đổi nhanh và quản lý danh sách tất cả ghi chú đã lưu.
- **Tìm kiếm tức thì**: Lọc nhanh ghi chú theo tiêu đề hoặc nội dung văn bản bên trong.
- **Lịch sử chỉnh sửa (Version History)**: Tự động chụp bản lưu tối đa **50 phiên bản/ghi chú** kèm nhãn thời gian và nguyên nhân thay đổi; khôi phục lại bất kỳ phiên bản cũ nào chỉ với 1 cú nhấp.

### 4. 6 Chủ đề màu tinh tế & Song ngữ (6 Curated Themes & Bilingual UI)
- **6 chủ đề màu được phối chuyên sâu**:
  - 🌕 **Paper** *(Giấy ấm — Ấm và tối giản)*
  - 🌌 **Midnight** *(Đêm sâu — Xanh đêm dịu)*
  - 🌊 **Ocean** *(Đại dương — Mát và thoáng)*
  - 🌸 **Sakura** *(Hoa anh đào — Hồng dịu nhẹ)*
  - 🌲 **Forest** *(Rừng xanh — Xanh tự nhiên)*
  - 🪨 **Graphite** *(Than chì — Tối trung tính)*
- **Đồng bộ tức thời**: Đổi chủ đề hoặc ngôn ngữ (**Tiếng Việt `VI`** / **Tiếng Anh `EN`**) trong Settings Popup sẽ áp dụng ngay lập tức cho mọi tab đang mở mà không làm mất nội dung đang gõ.

---

## 📥 Hướng dẫn cài đặt (Installation)

### Cách 1: Tải file ZIP (Khuyên dùng)
1. Nhấn vào nút **[⬇ Tải Xuống (Download ZIP)](https://github.com/diepvantien/Floating-Quick-Note/archive/refs/heads/main.zip)** hoặc tải từ mục **[Releases](https://github.com/diepvantien/Floating-Quick-Note/releases)**.
2. Giải nén file `.zip` vừa tải về một thư mục cố định trên máy tính.
3. Mở trình duyệt và truy cập:
   - **Google Chrome**: `chrome://extensions`
   - **Microsoft Edge**: `edge://extensions`
   - **Brave**: `brave://extensions`
4. Bật công tắc **Developer mode** *(Chế độ dành cho nhà phát triển)* ở góc trên bên phải.
5. Nhấn nút **Load unpacked** *(Tải tiện ích đã giải nén)* và chọn thư mục vừa giải nén.

### Cách 2: Clone qua Git
```bash
git clone https://github.com/diepvantien/Floating-Quick-Note.git
```
Sau đó mở `chrome://extensions`, bật **Developer mode** → chọn **Load unpacked** và trỏ tới thư mục `Floating-Quick-Note`.

---

## ⌨️ Hệ thống phím tắt mặc định (Default Shortcuts)

> Bạn có thể tùy chỉnh lại toàn bộ các phím tắt này trong phần **Shortcuts (Phím tắt)** của popup cài đặt.

### Phím tắt toàn trình duyệt (Global Browser Shortcuts)
| Thao tác | Windows / Linux | macOS |
| :--- | :--- | :--- |
| **Mở ghi chú (Open note)** | `Alt + Shift + N` | `Cmd + Shift + N` |
| **Tạo ghi chú mới (New note)** | `Alt + Shift + M` | `Cmd + Shift + M` |

### Phím tắt nhanh trong cửa sổ ghi chú (Quick Shortcuts)
| Thao tác | Windows / Linux | macOS |
| :--- | :--- | :--- |
| **Lưu ghi chú (Save note)** | `Ctrl + S` | `Cmd + S` |
| **Tìm kiếm ghi chú (Search notes)** | `Ctrl + K` | `Cmd + K` |
| **Tạo ghi chú mới (New note)** | `Ctrl + Alt + N` | `Cmd + Alt + N` |
| **Sao chép toàn bộ ghi chú (Copy note)** | `Ctrl + Alt + C` | `Cmd + Alt + C` |
| **Mở lịch sử chỉnh sửa (History)** | `Ctrl + Alt + H` | `Cmd + Alt + H` |
| **Thu gọn thành bong bóng (Collapse)** | `Ctrl + Alt + M` | `Cmd + Alt + M` |
| **Ghi chú tiếp theo (Next note)** | `Ctrl + Alt + ↓` | `Cmd + Alt + ↓` |
| **Ghi chú trước đó (Previous note)** | `Ctrl + Alt + ↑` | `Cmd + Alt + ↑` |

### Phím tắt khi đang chọn ảnh (Image Context Shortcuts)
| Thao tác | Phím tắt |
| :--- | :--- |
| **Sao chép ảnh đang chọn** | `Ctrl + C` / `Cmd + C` |
| **Phóng to / Thu nhỏ ảnh** | `+` / `−` *(hoặc giữ `Ctrl/Cmd/Alt + Cuộn chuột`)* |
| **Đặt lại kích thước vừa khung (100%)** | `0` |
| **Xem trước ảnh (Lightbox)** | `Enter` *(hoặc Double-click vào ảnh)* |
| **Xóa ảnh đang chọn** | `Delete` / `Backspace` |

---

## 📁 Cấu trúc thư mục (Project Structure)

```text
Floating-Quick-Note/
├── manifest.json       # Cấu hình Chrome Extension Manifest V3 (v1.0.0)
├── background.js       # Service Worker: quản lý state, context menu, lệnh toàn cục & xử lý ảnh
├── content.js          # Giao diện cửa sổ ghi chú nổi & bong bóng (Shadow DOM), trình soạn thảo, HUD ảnh
├── popup.html          # Giao diện Popup cài đặt (Theme, Ngôn ngữ, Phím tắt, Dữ liệu)
├── popup.css           # Hệ thống thiết kế & bảng màu 6 chủ đề cho Popup cài đặt
├── popup.js            # Logic đồng bộ cài đặt, ghi nhận phím tắt & đa ngôn ngữ
├── standalone.html     # Cửa sổ ghi chú độc lập khi mở trên trang hệ thống của trình duyệt
├── icons/              # Bộ icon tiện ích (16, 32, 48, 128) & tài nguyên biểu tượng
├── LICENSE             # Giấy phép MIT (Giới hạn sử dụng cá nhân)
└── README.md           # Tài liệu hướng dẫn sử dụng
```

---

## 👤 Tác giả & Ủng hộ (Author & Donate)

Dự án được phát triển và thiết kế bởi **DIEP VAN TIEN**.

- **Tác giả (Author)**: **DIEP VAN TIEN**
- **GitHub**: [@diepvantien](https://github.com/diepvantien)
- **Repository**: [https://github.com/diepvantien/Floating-Quick-Note](https://github.com/diepvantien/Floating-Quick-Note)

Nếu bạn thấy tiện ích **Floating Quick Note** hữu ích cho công việc và học tập hằng ngày, bạn có thể ủng hộ tác giả một ly cà phê qua:

| Kênh ủng hộ | Liên kết |
| :--- | :--- |
| <img src="icons/momo.png" width="16" height="16" alt="MoMo" /> **Ví MoMo** | [**https://me.momo.vn/OeIGiJsViJfDfntmiRId**](https://me.momo.vn/OeIGiJsViJfDfntmiRId) |
| ☕ **Buy Me a Coffee** | [**https://buymeacoffee.com/tixuno**](https://buymeacoffee.com/tixuno) |

---

## 📄 Giấy phép (License)

### MIT License — Chỉ sử dụng cho mục đích cá nhân (Personal Use Only)

Copyright (c) 2026 **DIEP VAN TIEN**

Phần mềm này được cấp phép theo các điều khoản của **Giấy phép MIT (MIT License)** với điều kiện giới hạn **chỉ dành cho mục đích sử dụng cá nhân, phi thương mại (Personal, Non-Commercial Use Only)**:

- ✅ **Được phép**: Tải xuống, sử dụng cá nhân, học tập và tùy biến cho nhu cầu cá nhân.
- ❌ **Không được phép**: Sử dụng cho mục đích thương mại, bán lại, đóng gói lại để phân phối thương mại hoặc phát hành lại lên các kho ứng dụng dưới tên khác khi chưa có sự đồng ý bằng văn bản của tác giả **DIEP VAN TIEN**.

```text
MIT License (Personal Use Only)

Copyright (c) 2026 DIEP VAN TIEN

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to use,
copy, modify, and merge the Software strictly for personal, non-commercial
purposes, subject to the following conditions:

1. The above copyright notice, author attribution ("DIEP VAN TIEN"), and this
   permission notice shall be included in all copies or substantial portions
   of the Software.
2. Commercial use, sale, paid distribution, or re-publishing of the Software
   as a competing or rebranded product without prior written permission from
   the copyright holder is strictly prohibited.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
