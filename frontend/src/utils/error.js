export function formatError(error) {
  if (!error) return "Lỗi không xác định.";

  const code = error?.code;
  if (code === 4001 || code === "ACTION_REJECTED") {
    return "Bạn đã huỷ thao tác trên MetaMask.";
  }

  const short = error?.shortMessage;
  if (typeof short === "string" && short.trim()) return short;

  const message = error?.message;
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

