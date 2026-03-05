# Aviation Logistics Console (Frontend)

Frontend React + Vite cho demo quản lý kho vật tư/phụ tùng & kiểm định.

## Chạy nhanh

Chạy từ thư mục root của repo:

- `npm run dev` (khuyến nghị)

Lệnh này sẽ:
- chạy Ganache (chainId 1337)
- compile + deploy contract + seed data
- chạy Vite dev server

## MetaMask

- Cài MetaMask
- Bấm nút "Ganache 1337" trên UI để tự add/switch network
- Import các account demo từ Ganache (mnemonic mặc định của Ganache CLI là `test test test ... junk`)
- RPC Ganache mặc định: http://127.0.0.1:8787 (có thể đổi trong `frontend/.env` qua `VITE_GANACHE_RPC_URL`)

## Scripts hữu ích (từ root)

- `npm run check`: test + lint + build
- `npm run frontend:dev`: chạy riêng frontend
- `npm run frontend:build`: build production
- `npm run frontend:preview`: preview build
