<div align="center">

<img src="icons/icon128.png" alt="Floating Quick Note logo" width="88" height="88" />

# Floating Quick Note

**Floating notes with Vietnamese typing support, image tools, and customizable shortcuts for Chromium browsers.**

[![Version](https://img.shields.io/badge/version-v1.0.0-eba825?style=for-the-badge)](https://github.com/diepvantien/Floating-Quick-Note/releases)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-259fd1?style=for-the-badge)](manifest.json)
[![Languages](https://img.shields.io/badge/languages-EN%20%7C%20VI-5c996b?style=for-the-badge)](#english)
[![License](https://img.shields.io/badge/license-Personal%20Use-8496ff?style=for-the-badge)](LICENSE)

[English](#english) · [Tiếng Việt](#tieng-viet)

[Download ZIP](https://github.com/diepvantien/Floating-Quick-Note/archive/refs/heads/main.zip) · [Releases](https://github.com/diepvantien/Floating-Quick-Note/releases) · [GitHub](https://github.com/diepvantien/Floating-Quick-Note)

</div>

---

<a id="english"></a>

## English

### Overview

Floating Quick Note lets you write notes alongside the page you are viewing. Open a floating editor, collapse it into a small bubble, and return to your notes without switching tabs.

The extension is built for Chromium browsers such as Chrome, Edge, Brave, and Arc. It includes an English/Vietnamese interface, multiple notes, image tools, search, and edit history. Notes and settings are stored locally and shared between tabs in the same browser profile.

### Features

- **Floating window and bubble:** Drag the note or bubble to a convenient position, resize the editor, and collapse or expand it with an animated transition. The bubble has no outer blur or drop shadow.
- **Keyboard isolation:** The floating interface runs in its own iframe with Shadow DOM. Website shortcut handlers do not receive typing events from the note, including when they were registered before the extension loaded. Click outside the note to return keyboard focus to the page.
- **Vietnamese typing:** Composition-aware input supports entering accented text in the editor, title, and search field. Note shortcuts wait while the input method is composing text, and incoming tab updates are deferred until composition finishes.
- **Text and images:** Type, paste text or images, drag in images, or use the page context menu to add selected text and images to a note.
- **Image tools:** Resize, fit, copy, delete, and preview images. The preview supports zooming and panning. External images are saved as data URLs when fetching succeeds, allowing those saved copies to display offline.
- **Copy an entire note:** Copy text and images together using the editor's copy button.
- **Multiple notes and search:** Create, switch between, delete, and search notes by title or content.
- **Automatic saving and history:** Save edits automatically and keep up to 50 history entries per note, with timestamps and restore controls.
- **Themes and languages:** Choose Paper, Midnight, Ocean, Sakura, Forest, or Graphite, and switch the interface between English and Vietnamese.
- **Standalone window:** When a page does not allow extension injection, such as a browser settings page or an extension store, opening a note uses a separate window.

### Installation

#### Download ZIP

1. Download the [ZIP archive](https://github.com/diepvantien/Floating-Quick-Note/archive/refs/heads/main.zip) or a package from [Releases](https://github.com/diepvantien/Floating-Quick-Note/releases).
2. Extract it into a permanent folder on your computer.
3. Open your browser's extension manager: `chrome://extensions`, `edge://extensions`, or `brave://extensions`.
4. Enable **Developer mode**.
5. Select **Load unpacked** and choose the folder containing `manifest.json`.

#### Clone with Git

```sh
git clone https://github.com/diepvantien/Floating-Quick-Note.git
```

Load the cloned folder using **Load unpacked** as described above. The extension does not require a build step.

#### Apply updates

Update the files in the folder already loaded by your browser, click **Reload** on the extension card, and reload your open web pages. Existing tabs need a page reload to use the updated content script.

### Getting started

1. Click the extension icon to open settings, then choose **Open note** or **New note**.
2. Click the note body to type or paste content. Edit the title at the top of the window.
3. Use the toolbar to open saved notes, create a note, view history, or collapse the window into a bubble.
4. Click the bubble to reopen the editor. Click outside the note to interact with the website again.
5. Open settings to change the theme, language, shortcuts, or manage local data.

To add content from a page, select text or right-click an image, then choose the corresponding **Floating Quick Note** context-menu item.

### Keyboard shortcuts

The browser-wide combinations below are the defaults suggested in the manifest. Manage their actual assignments through **Settings → Shortcuts → Browser shortcuts → Manage**. Customize note-window combinations directly in **Settings → Shortcuts**.

#### Browser-wide commands

| Action | Windows / Linux | macOS |
| --- | --- | --- |
| Open a note | `Alt + Shift + N` | `Cmd + Shift + N` |
| Create a new note | `Alt + Shift + M` | `Cmd + Shift + M` |

#### Inside the note window

These shortcuts work while the note interface has keyboard focus.

| Action | Windows / Linux | macOS |
| --- | --- | --- |
| Save note | `Ctrl + S` | `Cmd + S` |
| Search notes | `Ctrl + K` | `Cmd + K` |
| Create a new note | `Ctrl + Alt + N` | `Cmd + Alt + N` |
| Copy entire note | `Ctrl + Alt + C` | `Cmd + Alt + C` |
| Open edit history | `Ctrl + Alt + H` | `Cmd + Alt + H` |
| Collapse to bubble | `Ctrl + Alt + M` | `Cmd + Alt + M` |
| Next note | `Ctrl + Alt + ↓` | `Cmd + Alt + ↓` |
| Previous note | `Ctrl + Alt + ↑` | `Cmd + Alt + ↑` |

#### With an image selected

Image shortcuts apply in the editor or image controls, without taking over typing in the title or search field.

| Action | Shortcut |
| --- | --- |
| Copy selected image | `Ctrl + C` / `Cmd + C` |
| Enlarge / shrink image | `+` / `−`, or hold `Ctrl`, `Cmd`, or `Alt` while scrolling over the image |
| Fit image to note width | `0` |
| Open image preview | `Enter`, or double-click the image |
| Delete selected image | `Delete` / `Backspace` |

### Local data

Notes, saved images, edit history, and preferences use `chrome.storage.local`. Updates are shared between tabs in the same browser profile; this is not cloud synchronization between devices. Use **Settings → Data** to manage stored data.

### Project structure

| Path | Purpose |
| --- | --- |
| [`manifest.json`](manifest.json) | Manifest V3 configuration, permissions, and browser commands |
| [`background.js`](background.js) | Service worker, context menus, global commands, image fetching, and standalone windows |
| [`content.js`](content.js) | Floating iframe interface, editor, bubble, image tools, and note synchronization |
| [`popup.html`](popup.html) | Settings interface |
| [`popup.css`](popup.css) | Settings layout and themes |
| [`popup.js`](popup.js) | Settings, language selection, and shortcut customization |
| [`standalone.html`](standalone.html) | Note window for pages where injection is unavailable |
| [`icons/`](icons/) | Extension icons and supporting images |
| [`tests/typing.test.cjs`](tests/typing.test.cjs) | Browser regression tests for typing, isolation, and window interactions |
| [`tests/README.md`](tests/README.md) | Additional testing notes in Vietnamese |
| [`LICENSE`](LICENSE) | License terms |

### Development and testing

Edit the extension files, reload the extension, and refresh the page to test changes. No application build is needed.

The automated tests require Node.js, Playwright, and Chrome:

```sh
npm install --no-save --package-lock=false playwright
node --test tests/typing.test.cjs
```

The test runner uses Chrome's default macOS path. Set `CHROME_BIN` to your Chrome or Chromium executable on other systems. If Playwright is installed outside this project, set `NODE_PATH` to its `node_modules` directory.

Tests run in headless Chrome with a temporary profile and mocked extension storage. They cover website shortcut conflicts, special characters, native IME composition, title persistence, incoming storage updates, undo/redo, dragging, resizing, collapsing, iframe recovery, and standalone mode. Direct testing with your operating system's Vietnamese input method remains useful alongside automated IME tests.

### Author and support

Created by **DIEP VAN TIEN**.

- GitHub: [@diepvantien](https://github.com/diepvantien)
- Repository: [Floating-Quick-Note](https://github.com/diepvantien/Floating-Quick-Note)
- Support via [MoMo](https://me.momo.vn/OeIGiJsViJfDfntmiRId) or [Buy Me a Coffee](https://buymeacoffee.com/tixuno).

### License

Copyright © 2026 **DIEP VAN TIEN**.

The project includes a license titled **MIT License (Personal Use Only)**. It permits personal, non-commercial use, copying, modification, and merging under the terms in [`LICENSE`](LICENSE). Commercial use, sale, sublicensing, distribution, or integration into commercial products, paid services, or monetized platforms requires the author's explicit prior written permission. Retain the copyright and permission notices in copies or substantial portions of the software.

See [`LICENSE`](LICENSE) for the complete terms.

---

<a id="tieng-viet"></a>

## Tiếng Việt

### Giới thiệu

Floating Quick Note giúp bạn ghi chú ngay bên cạnh trang web đang xem. Mở cửa sổ soạn thảo nổi, thu gọn thành bong bóng nhỏ và quay lại ghi chú mà không cần chuyển tab.

Tiện ích dành cho các trình duyệt Chromium như Chrome, Edge, Brave và Arc. Các tính năng gồm giao diện tiếng Anh/tiếng Việt, nhiều ghi chú, công cụ ảnh, tìm kiếm và lịch sử chỉnh sửa. Ghi chú và cài đặt được lưu cục bộ, dùng chung giữa các tab trong cùng hồ sơ trình duyệt.

### Tính năng

- **Cửa sổ nổi và bong bóng:** Kéo ghi chú hoặc bong bóng tới vị trí thuận tiện, đổi kích thước vùng soạn thảo và thu gọn/mở rộng với hiệu ứng chuyển động. Bong bóng không có quầng mờ hoặc bóng đổ bên ngoài.
- **Cô lập bàn phím:** Giao diện nổi chạy trong iframe riêng kết hợp Shadow DOM. Các bộ xử lý phím tắt của trang web không nhận sự kiện gõ từ ghi chú, kể cả khi đã được đăng ký trước lúc extension được nạp. Bấm ra ngoài ghi chú để trả bàn phím cho trang web.
- **Gõ tiếng Việt:** Hỗ trợ quá trình ghép dấu trong nội dung, tiêu đề và ô tìm kiếm. Phím tắt của ghi chú tạm nhường cho bộ gõ khi đang ghép chữ; cập nhật từ tab khác được chờ đến khi ghép chữ hoàn tất.
- **Văn bản và hình ảnh:** Gõ, dán văn bản hoặc ảnh, kéo thả ảnh, hoặc dùng menu chuột phải của trang web để thêm văn bản đã chọn và ảnh vào ghi chú.
- **Công cụ ảnh:** Đổi kích thước, căn vừa khung, sao chép, xóa và xem trước ảnh. Chế độ xem trước hỗ trợ thu phóng và kéo để di chuyển ảnh. Ảnh từ liên kết ngoài được lưu dưới dạng data URL khi tải thành công, giúp các bản đã lưu hiển thị khi ngoại tuyến.
- **Sao chép toàn bộ ghi chú:** Sao chép cả văn bản và ảnh bằng nút sao chép trong vùng soạn thảo.
- **Nhiều ghi chú và tìm kiếm:** Tạo, chuyển đổi, xóa và tìm ghi chú theo tiêu đề hoặc nội dung.
- **Tự động lưu và lịch sử:** Tự động lưu thay đổi và giữ tối đa 50 mục lịch sử cho mỗi ghi chú, kèm thời gian và thao tác khôi phục.
- **Chủ đề và ngôn ngữ:** Chọn Paper, Midnight, Ocean, Sakura, Forest hoặc Graphite; chuyển giao diện giữa tiếng Anh và tiếng Việt.
- **Cửa sổ độc lập:** Khi trang không cho phép chèn extension, chẳng hạn trang cài đặt trình duyệt hoặc cửa hàng tiện ích, thao tác mở ghi chú sẽ sử dụng cửa sổ riêng.

### Cài đặt

#### Tải file ZIP

1. Tải [file ZIP](https://github.com/diepvantien/Floating-Quick-Note/archive/refs/heads/main.zip) hoặc một bản phát hành tại [Releases](https://github.com/diepvantien/Floating-Quick-Note/releases).
2. Giải nén vào một thư mục cố định trên máy tính.
3. Mở trang quản lý tiện ích: `chrome://extensions`, `edge://extensions` hoặc `brave://extensions`.
4. Bật **Developer mode** — chế độ dành cho nhà phát triển.
5. Chọn **Load unpacked** — tải tiện ích đã giải nén — rồi chọn thư mục chứa `manifest.json`.

#### Clone bằng Git

```sh
git clone https://github.com/diepvantien/Floating-Quick-Note.git
```

Nạp thư mục vừa clone bằng **Load unpacked** theo hướng dẫn trên. Tiện ích không cần bước build.

#### Áp dụng bản cập nhật

Cập nhật các tệp trong đúng thư mục mà trình duyệt đang nạp, bấm **Reload** trên thẻ tiện ích, rồi tải lại các trang web đang mở. Các tab cũ cần được tải lại để sử dụng content script mới.

### Bắt đầu sử dụng

1. Bấm biểu tượng extension để mở cài đặt, sau đó chọn **Mở ghi chú** hoặc **Ghi chú mới**.
2. Bấm vào nội dung ghi chú để gõ hoặc dán. Sửa tiêu đề ở đầu cửa sổ.
3. Dùng thanh công cụ để mở danh sách ghi chú, tạo ghi chú, xem lịch sử hoặc thu gọn thành bong bóng.
4. Bấm bong bóng để mở lại vùng soạn thảo. Bấm ra ngoài ghi chú để tiếp tục thao tác với trang web.
5. Mở cài đặt để đổi chủ đề, ngôn ngữ, phím tắt hoặc quản lý dữ liệu cục bộ.

Để thêm nội dung từ trang web, chọn văn bản hoặc nhấp chuột phải vào ảnh, rồi chọn mục **Floating Quick Note** tương ứng trong menu.

### Phím tắt

Các tổ hợp toàn trình duyệt bên dưới là mặc định được đề xuất trong manifest. Quản lý tổ hợp thực tế tại **Cài đặt → Phím tắt → Phím tắt trình duyệt → Quản lý**. Các tổ hợp trong cửa sổ ghi chú được tùy chỉnh trực tiếp tại **Cài đặt → Phím tắt**.

#### Lệnh toàn trình duyệt

| Thao tác | Windows / Linux | macOS |
| --- | --- | --- |
| Mở ghi chú | `Alt + Shift + N` | `Cmd + Shift + N` |
| Tạo ghi chú mới | `Alt + Shift + M` | `Cmd + Shift + M` |

#### Trong cửa sổ ghi chú

Các phím tắt này hoạt động khi bàn phím đang được đặt vào giao diện ghi chú.

| Thao tác | Windows / Linux | macOS |
| --- | --- | --- |
| Lưu ghi chú | `Ctrl + S` | `Cmd + S` |
| Tìm ghi chú | `Ctrl + K` | `Cmd + K` |
| Tạo ghi chú mới | `Ctrl + Alt + N` | `Cmd + Alt + N` |
| Sao chép toàn bộ ghi chú | `Ctrl + Alt + C` | `Cmd + Alt + C` |
| Mở lịch sử chỉnh sửa | `Ctrl + Alt + H` | `Cmd + Alt + H` |
| Thu gọn thành bong bóng | `Ctrl + Alt + M` | `Cmd + Alt + M` |
| Ghi chú tiếp theo | `Ctrl + Alt + ↓` | `Cmd + Alt + ↓` |
| Ghi chú trước đó | `Ctrl + Alt + ↑` | `Cmd + Alt + ↑` |

#### Khi đang chọn ảnh

Phím tắt ảnh áp dụng trong vùng soạn thảo hoặc công cụ ảnh, không chiếm phím đang gõ trong tiêu đề hay ô tìm kiếm.

| Thao tác | Phím tắt |
| --- | --- |
| Sao chép ảnh đang chọn | `Ctrl + C` / `Cmd + C` |
| Phóng to / thu nhỏ ảnh | `+` / `−`, hoặc giữ `Ctrl`, `Cmd` hay `Alt` khi cuộn chuột trên ảnh |
| Căn ảnh vừa chiều rộng ghi chú | `0` |
| Mở xem trước ảnh | `Enter`, hoặc nhấp đúp vào ảnh |
| Xóa ảnh đang chọn | `Delete` / `Backspace` |

### Dữ liệu cục bộ

Ghi chú, ảnh đã lưu, lịch sử chỉnh sửa và tùy chọn sử dụng `chrome.storage.local`. Cập nhật được chia sẻ giữa các tab trong cùng hồ sơ trình duyệt; đây không phải đồng bộ đám mây giữa các thiết bị. Vào **Cài đặt → Dữ liệu** để quản lý dữ liệu đã lưu.

### Cấu trúc dự án

| Đường dẫn | Chức năng |
| --- | --- |
| [`manifest.json`](manifest.json) | Cấu hình Manifest V3, quyền truy cập và lệnh trình duyệt |
| [`background.js`](background.js) | Service worker, menu chuột phải, lệnh toàn cục, tải ảnh và cửa sổ độc lập |
| [`content.js`](content.js) | Giao diện iframe nổi, vùng soạn thảo, bong bóng, công cụ ảnh và đồng bộ ghi chú |
| [`popup.html`](popup.html) | Giao diện cài đặt |
| [`popup.css`](popup.css) | Bố cục và chủ đề của cài đặt |
| [`popup.js`](popup.js) | Cài đặt, lựa chọn ngôn ngữ và tùy chỉnh phím tắt |
| [`standalone.html`](standalone.html) | Cửa sổ ghi chú dành cho trang không cho phép chèn tiện ích |
| [`icons/`](icons/) | Biểu tượng tiện ích và hình ảnh đi kèm |
| [`tests/typing.test.cjs`](tests/typing.test.cjs) | Kiểm thử trình duyệt cho nhập liệu, cô lập sự kiện và thao tác cửa sổ |
| [`tests/README.md`](tests/README.md) | Hướng dẫn kiểm thử bổ sung bằng tiếng Việt |
| [`LICENSE`](LICENSE) | Điều khoản giấy phép |

### Phát triển và kiểm thử

Sửa các tệp của tiện ích, nạp lại extension rồi tải lại trang web để kiểm tra thay đổi. Không cần build ứng dụng.

Bộ kiểm thử tự động cần Node.js, Playwright và Chrome:

```sh
npm install --no-save --package-lock=false playwright
node --test tests/typing.test.cjs
```

Bộ chạy kiểm thử dùng đường dẫn Chrome mặc định trên macOS. Đặt `CHROME_BIN` thành đường dẫn tệp thực thi Chrome hoặc Chromium nếu dùng hệ điều hành khác. Nếu Playwright được cài ngoài dự án, đặt `NODE_PATH` tới thư mục `node_modules` tương ứng.

Kiểm thử chạy Chrome headless với hồ sơ tạm và mô phỏng API lưu trữ của extension. Các ca kiểm tra bao gồm xung đột phím tắt của web, ký tự đặc biệt, ghép dấu qua IME gốc, lưu tiêu đề, cập nhật từ bộ nhớ, hoàn tác/làm lại, kéo, đổi kích thước, thu gọn, phục hồi iframe và chế độ cửa sổ độc lập. Nên kết hợp kiểm thử IME tự động với việc thử trực tiếp bộ gõ tiếng Việt đang dùng trên hệ điều hành.

### Tác giả và ủng hộ

Phát triển bởi **DIEP VAN TIEN**.

- GitHub: [@diepvantien](https://github.com/diepvantien)
- Mã nguồn: [Floating-Quick-Note](https://github.com/diepvantien/Floating-Quick-Note)
- Ủng hộ qua [MoMo](https://me.momo.vn/OeIGiJsViJfDfntmiRId) hoặc [Buy Me a Coffee](https://buymeacoffee.com/tixuno).

### Giấy phép

Bản quyền © 2026 **DIEP VAN TIEN**.

Dự án có giấy phép mang tên **MIT License (Personal Use Only)**. Giấy phép cho phép sử dụng, sao chép, sửa đổi và kết hợp mã cho mục đích cá nhân, phi thương mại theo các điều khoản trong [`LICENSE`](LICENSE). Việc sử dụng thương mại, bán, cấp phép lại, phân phối hoặc tích hợp vào sản phẩm thương mại, dịch vụ trả phí hay nền tảng kiếm tiền cần có sự đồng ý rõ ràng trước bằng văn bản của tác giả. Giữ thông báo bản quyền và thông báo cấp phép trong các bản sao hoặc phần đáng kể của phần mềm.

Xem đầy đủ điều khoản tại [`LICENSE`](LICENSE).

[Back to English / Quay lại phần tiếng Anh](#english)
