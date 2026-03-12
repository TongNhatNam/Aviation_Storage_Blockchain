# Hướng dẫn Kiểm Thử EngineerActions.jsx

## Tóm tắt Thay đổi
File `EngineerActions.jsx` đã được cập nhật để sử dụng hệ thống tabs như `WarehouseActions.jsx`:

### ✅ Các tính năng đã triển khai:
1. **State `activeTab`** - Quản lý tab hiện tại (mặc định: "INSPECT")
2. **Thanh Tabs** - 2 nút điều hướng với CSS classes `avi-tabs`, `avi-tab`, `avi-tabIcon`
3. **Tab 1: Kiểm định Kỹ thuật**
   - Form quét mã QR hoặc nhập mã thủ công
   - Chọn trạng thái (Serviceable/Unserviceable)
   - Tự động tạo notesHash
   - Danh sách thiết bị Pending (chờ kiểm định)
   - Nút "Gửi giao dịch" và "Tiêu Hủy (Scrap)"

4. **Tab 2: Tháo dỡ (Demount)**
   - Form quét mã QR hoặc nhập mã thủ công
   - Chọn kho đích để dỡ về
   - Danh sách thiết bị Locked (đang trên máy bay)
   - Nút "Xác nhận tháo dỡ"

5. **Tối ưu Data Fetching**
   - useEffect tự động fetch dữ liệu khi chuyển tab
   - Tab INSPECT: Tải danh sách Pending items
   - Tab DEMOUNT: Tải danh sách Locked items + Warehouse locations

---

## Hướng dẫn Kiểm Thử Manual

### Bước 1: Khởi động ứng dụng
```bash
npm run dev
```
- Đảm bảo Ganache chạy ở cổng 8787
- MetaMask kết nối đúng tài khoản Engineer (Account 2)

### Bước 2: Truy cập giao diện Engineer
1. Mở trình duyệt tại `http://localhost:5173/`
2. Chọn vai trò **Engineer** từ trang chủ
3. Hoặc truy cập trực tiếp: `http://localhost:5173/#/engineer`

### Bước 3: Kiểm tra Thanh Tabs
**Kỳ vọng:**
- Trên cùng có 2 nút tab:
  - 🔧 **Kiểm định Kỹ thuật** (mặc định active)
  - 🔄 **Tháo dỡ (Demount)**
- Nút active có nền xanh dương sáng, nút inactive mờ

**Cách kiểm tra:**
```
✓ Nút "Kiểm định Kỹ thuật" có nền sáng (active)
✓ Nút "Tháo dỡ (Demount)" có nền mờ (inactive)
✓ Cả 2 nút đều có icon (🔧 và 🔄)
```

### Bước 4: Kiểm tra Tab 1 - Kiểm định Kỹ thuật
**Nội dung hiển thị:**
1. **Form Kiểm định:**
   - Input "Mã (code)" + nút 📷 quét QR
   - Dropdown chọn trạng thái (Serviceable/Unserviceable)
   - Input "notesHash" (read-only, tự động tạo)

2. **Nút hành động:**
   - "Gửi giao dịch" (xanh dương)
   - "🗑️ Tiêu Hủy (Scrap)" (đỏ, chỉ hiển thị khi chọn Unserviceable)
   - "Làm mới danh sách"

3. **Danh sách Pending:**
   - Tiêu đề: "Cần kiểm định (Pending)"
   - Hiển thị danh sách thiết bị chưa kiểm định
   - Mỗi item có:
     - Mã code (xanh dương)
     - Nút "📱 Copy QR Link"
     - Trạng thái (Pending/Unserviceable)
     - Tên thiết bị + Part Number
     - Vị trí kho

**Cách kiểm tra:**
```
✓ Form kiểm định hiển thị đầy đủ
✓ Khi chọn "Unserviceable", nút "Tiêu Hủy" xuất hiện
✓ Khi chọn "Serviceable", nút "Tiêu Hủy" ẩn đi
✓ notesHash tự động cập nhật khi thay đổi code hoặc status
✓ Danh sách Pending tải đúng dữ liệu
✓ Click vào item trong danh sách → code tự động điền vào form
```

### Bước 5: Kiểm tra Tab 2 - Tháo dỡ (Demount)
**Nội dung hiển thị:**
1. **Form Tháo dỡ:**
   - Input "Mã (code)" + nút 📷 quét QR
   - Dropdown chọn kho đích (danh sách warehouse locations)
   - Nút "🔧 Xác nhận tháo dỡ" (vàng cam)

2. **Danh sách Locked Items:**
   - Tiêu đề: "Tháo dỡ Kỹ thuật (Demount)"
   - Hiển thị danh sách thiết bị đang trên máy bay (Locked)
   - Mỗi item có:
     - Mã code (xanh dương)
     - Badge "LOCKED" (vàng cam)
     - Tên thiết bị
     - Vị trí máy bay

**Cách kiểm tra:**
```
✓ Form tháo dỡ hiển thị đầy đủ
✓ Dropdown kho đích tải đúng danh sách
✓ Danh sách Locked items tải đúng dữ liệu
✓ Click vào item trong danh sách → code tự động điền vào form
✓ Nút "Xác nhận tháo dỡ" disabled khi chưa chọn code hoặc kho
```

### Bước 6: Kiểm tra Chuyển đổi Tab
**Cách kiểm tra:**
```
1. Ở Tab 1, nhập mã code vào form
2. Click nút "Tháo dỡ (Demount)"
3. ✓ Tab chuyển sang Tab 2
4. ✓ Form tháo dỡ trống (không giữ lại dữ liệu từ Tab 1)
5. ✓ Danh sách Locked items tải lại
6. Click nút "Kiểm định Kỹ thuật"
7. ✓ Tab chuyển về Tab 1
8. ✓ Danh sách Pending items tải lại
```

### Bước 7: Kiểm tra Quét QR
**Cách kiểm tra:**
```
1. Ở Tab 1, click nút 📷 (quét QR)
2. ✓ Modal quét QR mở ra
3. Quét mã QR của một thiết bị
4. ✓ Code tự động điền vào input "Mã (code)"
5. ✓ Modal đóng lại
6. Chuyển sang Tab 2
7. Click nút 📷 (quét QR)
8. ✓ Modal quét QR mở ra
9. Quét mã QR
10. ✓ Code tự động điền vào input "Mã (code)" của Tab 2
```

### Bước 8: Kiểm tra Gửi Giao dịch
**Cách kiểm tra:**
```
1. Ở Tab 1, nhập mã code
2. Chọn trạng thái "Serviceable"
3. Click "Gửi giao dịch"
4. ✓ Nút disabled (busy state)
5. ✓ Hiển thị thông báo "OK" (xanh) hoặc lỗi (đỏ)
6. ✓ Danh sách Pending items làm mới
7. ✓ TransactionInfo hiển thị receipt
```

---

## Kiểm tra CSS & Styling

### Tabs Bar
```
✓ Nền gradient xanh dương nhạt
✓ Border xanh dương mờ
✓ Padding 10px
✓ Border-radius 12px
✓ Box-shadow mờ
```

### Tab Button (Inactive)
```
✓ Nền rgba(255, 255, 255, 0.03)
✓ Border rgba(255, 255, 255, 0.08)
✓ Text màu trắng mờ
✓ Font uppercase, letter-spacing 1px
✓ Hover: nền sáng hơn, border xanh dương
```

### Tab Button (Active)
```
✓ Nền gradient xanh dương
✓ Border xanh dương sáng
✓ Text màu trắng
✓ Box-shadow xanh dương
✓ Icon có nền xanh dương
```

---

## Troubleshooting

### Vấn đề: Tabs không hiển thị
**Giải pháp:**
- Kiểm tra CSS classes `avi-tabs`, `avi-tab`, `avi-tabIcon` trong `components.css`
- Reload trang (Ctrl+R)
- Xóa cache browser (Ctrl+Shift+Delete)

### Vấn đề: Danh sách Pending/Locked không tải
**Giải pháp:**
- Kiểm tra console (F12) có lỗi gì không
- Đảm bảo MetaMask kết nối đúng
- Chạy lại `npm run seed:ganache` để có dữ liệu test

### Vấn đề: Quét QR không hoạt động
**Giải pháp:**
- Kiểm tra camera có được cấp quyền không
- Thử quét mã QR từ file `TestQRPage.jsx`
- Kiểm tra console có lỗi gì không

### Vấn đề: Gửi giao dịch thất bại
**Giải pháp:**
- Kiểm tra MetaMask có gas không
- Kiểm tra code có tồn tại không
- Kiểm tra console có lỗi gì không

---

## Kết luận
Sau khi hoàn thành tất cả các bước kiểm tra trên, bạn có thể xác nhận rằng:
- ✅ Hệ thống tabs hoạt động đúng
- ✅ Dữ liệu tải đúng khi chuyển tab
- ✅ Form và danh sách hiển thị đúng
- ✅ Giao diện CSS/styling đúng
- ✅ Quét QR hoạt động
- ✅ Gửi giao dịch hoạt động

**Thay đổi đã sẵn sàng để merge vào production!** 🚀
