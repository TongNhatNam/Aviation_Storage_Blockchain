export function isItemLocked(item) {
  if (!item) return false;
  if (item.isFinalized === true) return true;
  const location = String(item.location ?? "").trim().toLowerCase();
  return location.startsWith("aircraft");
}

