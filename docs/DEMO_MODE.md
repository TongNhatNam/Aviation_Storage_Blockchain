# Demo Mode - Chạy ứng dụng mà không cần Blockchain

## Cách nhanh nhất để demo

Nếu bạn chỉ muốn xem giao diện và chức năng mà không cần setup Ganache hay MetaMask:

```bash
npm run setup
npm run dev:frontend
```

Sau đó truy cập `http://localhost:5173/`

## Chế độ Demo là gì?

- ✅ Toàn bộ UI/UX hoạt động bình thường
- ✅ Có dữ liệu mẫu sẵn (3 thiết bị)
- ✅ Có thể thực hiện các hành động (thêm, sửa, xóa)
- ✅ Không cần MetaMask hay Ganache
- ⚠️ Dữ liệu chỉ lưu trong bộ nhớ (reload trang sẽ mất)

## Dữ liệu mẫu có sẵn

1. **ENG-001** - Engine Compressor Blade (Serviceable)
2. **HYD-002** - Hydraulic Pump Assembly (Unserviceable)
3. **ELE-003** - Electrical Control Unit (Serviceable)

## Khi nào dùng Demo Mode?

- 👥 Onboard team member mới
- 🎨 Demo giao diện cho khách hàng
- 🧪 Test UI/UX nhanh
- 📱 Chạy trên máy không có Ganache

## Khi nào cần Blockchain thực?

- 🔐 Test logic Smart Contract
- 💾 Lưu dữ liệu vĩnh viễn
- 🔗 Test tương tác blockchain thực
- 👤 Test phân quyền người dùng

Để chạy với blockchain thực:
```bash
npm run dev
```

## Cấu trúc Mock Data

Mock data được định nghĩa trong `frontend/src/utils/mockContract.js`. Bạn có thể:
- Thêm/sửa dữ liệu mẫu
- Thay đổi danh sách warehouse locations
- Thay đổi danh sách transfer destinations

Ví dụ thêm item mẫu:
```javascript
const mockItems = {
  "NEW-001": {
    code: "NEW-001",
    partNumber: "PN-NEW",
    serialNumber: "SN-NEW",
    name: "New Part",
    location: "Warehouse A",
    // ... other fields
  }
};
```
