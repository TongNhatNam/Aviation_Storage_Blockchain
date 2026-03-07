# Aviation Storage Blockchain
Ứng dụng phi tập trung (DApp) quản lý kho vật tư và phụ tùng hàng không, kết hợp quy trình kiểm định chuyên nghiệm, chạy trên nền tảng blockchain cục bộ (Ganache) với giao diện tương tác qua MetaMask.

## Tính năng chính
- **Quản lý vật tư**: Nhập kho, xuất kho và luân chuyển vật tư/phụ tùng an toàn, minh bạch.
- **Kiểm định chất lượng**: Phân quyền cho kỹ sư hàng không thực hiện kiểm tra và chứng nhận tình trạng thiết bị (Serviceable/Unserviceable).
- **Truy xuất nguồn gốc**: Ghi nhận toàn bộ vòng đời và lịch sử thay đổi của vật tư không thể giả mạo trên blockchain.
- **Phân quyền người dùng**: Tích hợp các quyền hạn rõ ràng thông qua Smart Contract (Admin, Warehouse, Engineer).

## Công nghệ sử dụng
### Frontend
- **React 19 / Vite** - Framework xây dựng giao diện tốc độ cao
- **Ethers.js / Web3.js** - Thư viện tương tác với blockchain và Smart Contract
- **Recharts** - Hiển thị biểu đồ phân tích trực quan
- **html2canvas & jsPDF** - Hỗ trợ in và xuất chứng nhận điện tử (PDF)
- **qrcode.react** - Sinh mã QR cho thiết bị

### Blockchain & Backend
- **Solidity** - Ngôn ngữ lập trình Smart Contract
- **Hardhat** - Môi trường phát triển, biên dịch và kiểm thử Smart Contract
- **Ganache** - Mạng blockchain cục bộ hỗ trợ mô phỏng và test DApp

## Cấu trúc dự án
```text
aviation-blockchain-storage/
├── backend/             # Blockchain Core & Smart Contracts
│   ├── contracts/       # Smart Contracts (Solidity)
│   ├── scripts/         # Scripts tiện ích Hardhat (Deploy, Seed data)
│   ├── test/            # Unit tests cho Smart Contracts
│   ├── hardhat.config.js# Cấu hình mạng lưới Hardhat & Ganache
│   └── package.json     # Node modules cho lõi rễ Blockchain
├── frontend/            # Giao diện người dùng Web3 (React)
│   ├── src/             
│   │   ├── components/  # Các UI Component tái sử dụng
│   │   ├── pages/       # Các trang giao diện chính
│   │   ├── styles/      # Cấu trúc CSS UI/UX Design Token
│   │   └── utils/       # Hàm hỗ trợ tiện ích
├── docs/                # Thư mục chứa tài liệu hướng dẫn (Markdown)
└── package.json         # Danh sách tập lệnh điều phối chung (Workspace Scripts)
```

## Yêu cầu hệ thống
- **Node.js**: >= 18.0.0
- **Trình duyệt**: Chrome/Edge/Firefox (phiên bản mới nhất)
- **Tiện ích mở rộng**: MetaMask Wallet

## Hướng dẫn Cài đặt & Tải Dependencies

1. **Clone repository (Tải mã nguồn về máy)**
```bash
git clone <repository_url>
cd aviation-blockchain-storage
```

2. **Cài đặt thư viện (Dependencies)**
Phần mềm gồm 2 lớp (Blockchain Core và Frontend React). Bạn chỉ cần chạy 1 lệnh duy nhất dưới dây để hệ thống tự động tải toàn bộ thư viện cần thiết (`ethers`, `recharts`, `jspdf`, `ganache`,...) cho cả 2 lớp:
```bash
npm run setup
```
*(Lệnh này tương đương với việc chạy `npm install` ở thư mục gốc và `cd frontend && npm install` ở thư mục frontend).*

## Cấu hình MetaMask
1. Mở tiện ích MetaMask trên trình duyệt.
2. Thêm mạng lưới **Ganache** thủ công hoặc dùng tính năng tự động tích hợp trên giao diện DApp.
   - **RPC URL:** `http://127.0.0.1:8787` (Hoặc tuỳ chỉnh trong file cấu hình)
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
