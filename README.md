# Aviation Blockchain Storage (Demo)
Ứng dụng phi tập trung (DApp) quản lý kho vật tư và phụ tùng hàng không, kết hợp quy trình kiểm định chuyên nghiệm, chạy trên nền tảng blockchain cục bộ (Ganache) với giao diện tương tác qua MetaMask.

## Tính năng chính
- **Quản lý vật tư**: Nhập kho, xuất kho và luân chuyển vật tư/phụ tùng an toàn, minh bạch.
- **Kiểm định chất lượng**: Phân quyền cho kỹ sư hàng không thực hiện kiểm tra và chứng nhận tình trạng thiết bị (Serviceable/Unserviceable).
- **Truy xuất nguồn gốc**: Ghi nhận toàn bộ vòng đời và lịch sử thay đổi của vật tư không thể giả mạo trên blockchain.
- **Phân quyền người dùng**: Tích hợp các quyền hạn rõ ràng thông qua Smart Contract (Admin, Warehouse, Engineer).

## Công nghệ sử dụng
### Frontend
- **React/Vite** - Framework xây dựng giao diện tốc độ cao
- **Web3.js** - Thư viện tương tác với blockchain và Smart Contract

### Blockchain & Backend
- **Solidity** - Ngôn ngữ lập trình Smart Contract
- **Hardhat** - Môi trường phát triển, biên dịch và kiểm thử Smart Contract
- **Ganache** - Mạng blockchain cục bộ hỗ trợ mô phỏng và test DApp

## Cấu trúc dự án
```text
aviation-blockchain-storage/
├── contracts/           # Smart Contracts (Solidity)
│   ├── AviationStorage.sol # Logic quản lý vật tư & kiểm định
│   └── BaseItem.sol        # Cấu trúc dữ liệu cơ bản
├── frontend/            # Giao diện người dùng Web3 (React)
│   ├── src/             
│   │   ├── components/  # Các UI Component tái sử dụng
│   │   ├── contracts/   # ABI và địa chỉ Smart Contract
│   │   ├── hooks/       # Custom React Hooks (vd: useAviationStorageWeb3)
│   │   ├── pages/       # Các trang giao diện chính
│   │   ├── router/      # Định tuyến ứng dụng (React Router)
│   │   └── utils/       # Hàm hỗ trợ tiện ích
├── scripts/             # Scripts tiện ích Hardhat (Deploy, Seed data)
├── test/                # Unit tests cho Smart Contracts
└── hardhat.config.js    # Cấu hình Hardhat
```

## Yêu cầu hệ thống
- **Node.js**: >= 18.0.0
- **Trình duyệt**: Chrome/Edge/Firefox (phiên bản mới nhất)
- **Tiện ích mở rộng**: MetaMask Wallet

## Cài đặt

1. **Clone repository**
```bash
git clone <repository_url>
cd aviation-blockchain-storage
```

2. **Cài đặt dependencies cho cả workspace và frontend**
```bash
npm run setup
```

## Cấu hình MetaMask
1. Mở tiện ích MetaMask trên trình duyệt.
2. Thêm mạng lưới **Ganache** thủ công hoặc dùng tính năng tự động tích hợp trên giao diện DApp.
   - **RPC URL:** `http://127.0.0.1:8787`
   - **Chain ID:** `1337`
   - **Currency Symbol:** `ETH`
3. Nhập mật khẩu (Mnemonic) cấp sẵn của dự án để tải danh sách các tài khoản đóng vai trò:
   - *Mnemonic:* `test test test test test test test test test test test junk`
   - Role theo thứ tự Account:
     - Account 0: Admin
     - Account 1: Warehouse Manager
     - Account 2: Engineer

## Chạy ứng dụng

1. **Khởi động một chạm (Khuyên dùng)**
Chạy cả mạng lưới blockchain cục bộ (Ganache), deploy contract, seed dữ liệu mẫu và bật server Frontend (Vite):
```bash
npm run dev
```

2. Truy cập web tại thường là `http://localhost:5173/`. Đảm bảo ví MetaMask đã kết nối đúng vào tài khoản từ dòng lệnh.

## Troubleshooting nhanh
- **Lỗi không gọi được Smart Contract / RPC Error**:  
  Kiểm tra xem MetaMask đã chuyển sang mạng **Ganache (1337)** chưa, rồi thử chạy lại lệnh `npm run deploy:ganache` và `npm run seed:ganache`.
- **Lỗi bị chiếm cổng (Port in use)**:  
  Ganache mặc định chạy ở cổng `8787`. Nếu cổng này bị ứng dụng khác sử dụng, bạn có thể chỉnh môi trường:
  - PowerShell: `$env:GANACHE_PORT=8787; npm run dev`
  - Đừng quên cập nhật cả cổng trong tệp `frontend/.env` nếu đổi cấu hình. Mặc định là `1337` đối với Chain ID và `8787` đối với port. 

## Scripts hữu ích
- Phân tích code, kiểm tra tính toàn vẹn và chạy build thử:
```bash
npm run check
```
- Khởi chạy, Deploy thông tin lên network Ganache:
```bash
npm run deploy:ganache
```
- Đẩy dữ liệu mẫu lên ứng dụng để test:
```bash
npm run seed:ganache
```

## Đóng góp
- Fork repository.
- Tạo một nhánh tính năng (`git checkout -b feature/tinh-nang-moi`).
- Ghi nhận thay đổi (`git commit -m 'Thêm tính năng mới'`).
- Push lên nhánh đó (`git push origin feature/tinh-nang-moi`).
- Tạo Pull Request.

## Liên hệ
- **Email**: tongnhatnam1810@gmail.com
- **GitHub**: [https://github.com/TongNhatNam](https://github.com/TongNhatNam)
