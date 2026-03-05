export function formatError(error) {
  if (!error) return "Lỗi không xác định.";

  const code = error?.code;
  if (code === 4001 || code === "ACTION_REJECTED") {
    return "Bạn đã huỷ thao tác trên MetaMask.";
  }

  const short = error?.shortMessage;
  const message = error?.message;

  const combined = `${short ?? ""} ${message ?? ""}`.toLowerCase();
  if (code === "BAD_DATA" || combined.includes("could not decode result data")) {
    return "Không đọc được dữ liệu từ contract. Thường do Ganache vừa restart (address cũ không còn) hoặc đang sai network. Hãy chạy lại npm run dev và chuyển MetaMask sang Ganache 1337.";
  }
  if (typeof short === "string" && short.trim()) return short;

  if (typeof message === "string" && message.trim()) return message;

  const nestedMessage =
    error?.info?.error?.message ||
    error?.cause?.message ||
    error?.data?.message;
  if (typeof nestedMessage === "string" && nestedMessage.trim()) return nestedMessage;

  try {
    return String(error);
  } catch {
    return "Lỗi không xác định.";
  }
}
