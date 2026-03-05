pragma solidity ^0.8.24;

library BaseItem {
  enum InspectionStatus {
    Unknown,
    Serviceable,   // Tương đương Passed - Dùng tốt
    Unserviceable  // Tương đương Failed - Hỏng / Red-Tag
  }

  struct AuditRecord {
    uint256 timestamp;
    address actor;
    string action;
    string details;
  }

  struct Item {
    string code; // Mã nội bộ (Unique Key) = PN + SN
    string partNumber; // Mã nhận diện loại vật tư (VD: TIRE-A320)
    string serialNumber; // Số Serial độc nhất (VD: SN-0089)
    string name;
    string location; // Vị trí kho hoặc Máy bay đang lắp
    string metadataHash;
    InspectionStatus lastInspectionStatus;
    string lastInspectionNotesHash;
    uint256 createdAt;
    uint256 updatedAt;
    address lastUpdatedBy;
    AuditRecord[] history; // Dấu vết lịch sử
  }
}

