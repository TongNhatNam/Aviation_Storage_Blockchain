# 📱 HƯỚNG DẪN SCAN QR CODE BẰNG ĐIỆN THOẠI

## ⚠️ QUAN TRỌNG: Phải thay đổi IP trước khi demo!

### Bước 1: Tìm IP của máy tính

**Windows:**
```bash
ipconfig
```
Tìm dòng `IPv4 Address` (ví dụ: `192.168.1.100`)

**Mac/Linux:**
```bash
ifconfig
# hoặc
ip addr show
```

### Bước 2: Thay đổi IP trong code

Mở 3 file sau và thay `192.168.1.100` bằng IP thật của bạn:

1. `frontend/src/components/ItemQRCode.jsx` (dòng 9)
2. `frontend/src/components/WarehouseActions.jsx` (dòng 138)
3. `frontend/src/components/ItemViewer.jsx` (dòng 169)

**Tìm và thay:**
```javascript
? 'http://192.168.1.100:5173'  // ⚠️ THAY ĐỔI IP NÀY
```

**Thành:**
```javascript
? 'http://192.168.X.X:5173'  // IP thật của bạn
```

### Bước 3: Chạy Vite với network access

Thay vì `npm run dev`, chạy:

```bash
# Chạy Ganache
npm run ganache

# Terminal khác: Deploy và chạy frontend với --host
cd frontend
npm run dev -- --host
```

Hoặc sửa `frontend/package.json`:
```json
"dev": "vite --host"
```

### Bước 4: Kết nối điện thoại

1. ✅ Điện thoại và máy tính cùng WiFi
2. ✅ Mở browser trên điện thoại: `http://192.168.X.X:5173`
3. ✅ Scan QR code → Tự động tra cứu

---

## 🎯 CÁCH 2: Demo không cần điện thoại (Dễ hơn)

Nếu không muốn setup phức tạp, bạn có thể:

### Option A: Giả lập scan
1. Click vào QR code trên màn hình
2. Copy link
3. Mở tab mới và paste
4. Nói: "Đây là kết quả khi scan QR bằng điện thoại"

### Option B: Dùng webcam laptop
1. Cài app scan QR trên laptop (hoặc dùng online tool)
2. Scan QR trên màn hình
3. Mở link ngay trên laptop

---

## 💡 KHI DEMO

**Giáo viên hỏi:** "Sao không scan thật?"

**Trả lời:**
> "Thưa thầy/cô, để scan bằng điện thoại thật cần:
> 1. Máy tính và điện thoại cùng WiFi
> 2. Chạy Vite với --host để expose ra network
> 3. Thay localhost bằng IP local
> 
> Do môi trường demo, em đang giả lập bằng cách click vào QR và mở link. 
> Trong thực tế production, sẽ deploy lên server có domain thật (vd: aviation.example.com)"

---

## ✅ CHECKLIST TRƯỚC KHI DEMO

- [ ] Tìm IP máy tính (`ipconfig` hoặc `ifconfig`)
- [ ] Thay IP trong 3 file code
- [ ] Chạy `npm run dev -- --host` trong frontend
- [ ] Test mở `http://IP:5173` trên điện thoại
- [ ] Scan QR thử nghiệm

Hoặc:

- [ ] Chuẩn bị giải thích tại sao demo bằng click thay vì scan thật
- [ ] Nhấn mạnh: "Production sẽ có domain thật"
