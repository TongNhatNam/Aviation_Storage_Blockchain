pragma solidity ^0.8.24;

import "./AccessControl.sol";
import "./BaseItem.sol";

contract AviationStorage is AviationAccessControl {
  mapping(bytes32 => BaseItem.Item) private _items;
  mapping(bytes32 => bool) private _exists;

  bytes32[] private _itemIds;

  event ItemRegistered(
    bytes32 indexed itemId,
    string code,
    string partNumber,
    string serialNumber,
    string name,
    string location,
    string metadataHash,
    address indexed actor
  );

  event ItemTransferred(
    bytes32 indexed itemId,
    string destination,
    address indexed actor
  );

  event LocationUpdated(
    bytes32 indexed itemId,
    string newLocation,
    address indexed actor
  );

  event ItemInspected(
    bytes32 indexed itemId,
    BaseItem.InspectionStatus status,
    string notesHash,
    address indexed actor
  );

  function computeItemId(string memory code) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(code));
  }

  function itemCount() external view returns (uint256) {
    return _itemIds.length;
  }

  function itemIdAt(uint256 index) external view returns (bytes32) {
    require(index < _itemIds.length, "INDEX_OOB");
    return _itemIds[index];
  }

  function exists(string calldata code) external view returns (bool) {
    return _exists[computeItemId(code)];
  }

  function getItem(string calldata code) external view returns (BaseItem.Item memory) {
    bytes32 itemId = computeItemId(code);
    require(_exists[itemId], "ITEM_NOT_FOUND");
    return _items[itemId];
  }

  function getItemById(bytes32 itemId) external view returns (BaseItem.Item memory) {
    require(_exists[itemId], "ITEM_NOT_FOUND");
    return _items[itemId];
  }

  function registerItem(
    string calldata code,
    string calldata partNumber,
    string calldata serialNumber,
    string calldata name,
    string calldata location,
    string calldata metadataHash
  ) external onlyWarehouseStaff {
    require(bytes(code).length != 0, "EMPTY_CODE");
    require(bytes(partNumber).length != 0, "EMPTY_PN");
    require(bytes(serialNumber).length != 0, "EMPTY_SN");

    bytes32 itemId = computeItemId(code);
    require(!_exists[itemId], "ITEM_EXISTS");

    BaseItem.Item storage item = _items[itemId];
    item.code = code;
    item.partNumber = partNumber;
    item.serialNumber = serialNumber;
    item.name = name;
    item.location = location;
    item.metadataHash = metadataHash;
    item.lastInspectionStatus = BaseItem.InspectionStatus.Unknown;
    item.createdAt = block.timestamp;
    item.updatedAt = block.timestamp;
    item.lastUpdatedBy = msg.sender;

    item.history.push(BaseItem.AuditRecord({
      timestamp: block.timestamp,
      actor: msg.sender,
      action: "REGISTER",
      details: string(abi.encodePacked("Received in location: ", location))
    }));

    _exists[itemId] = true;
    _itemIds.push(itemId);

    emit ItemRegistered(itemId, code, partNumber, serialNumber, name, location, metadataHash, msg.sender);
  }

  function transferItem(
    string calldata code,
    string calldata destination
  ) external onlyWarehouseStaff {
    bytes32 itemId = computeItemId(code);
    require(_exists[itemId], "ITEM_NOT_FOUND");
    require(bytes(destination).length != 0, "EMPTY_DESTINATION");

    BaseItem.Item storage item = _items[itemId];
    
    // RED-TAG LOGIC: Prevent transfer if unserviceable (hỏng)
    require(item.lastInspectionStatus != BaseItem.InspectionStatus.Unserviceable, "ITEM_UNSERVICEABLE");

    item.location = destination;
    item.updatedAt = block.timestamp;
    item.lastUpdatedBy = msg.sender;

    item.history.push(BaseItem.AuditRecord({
      timestamp: block.timestamp,
      actor: msg.sender,
      action: "TRANSFER",
      details: string(abi.encodePacked("Transferred to: ", destination))
    }));

    emit ItemTransferred(itemId, destination, msg.sender);
  }

  function updateLocation(string calldata code, string calldata newLocation) external onlyWarehouseStaff {
    bytes32 itemId = computeItemId(code);
    require(_exists[itemId], "ITEM_NOT_FOUND");
    require(bytes(newLocation).length != 0, "EMPTY_LOCATION");

    BaseItem.Item storage item = _items[itemId];
    item.location = newLocation;
    item.updatedAt = block.timestamp;
    item.lastUpdatedBy = msg.sender;

    item.history.push(BaseItem.AuditRecord({
      timestamp: block.timestamp,
      actor: msg.sender,
      action: "UPDATE_LOCATION",
      details: string(abi.encodePacked("Moved to: ", newLocation))
    }));

    emit LocationUpdated(itemId, newLocation, msg.sender);
  }

  function inspectItem(
    string calldata code,
    BaseItem.InspectionStatus status,
    string calldata notesHash
  ) external onlyEngineer {
    bytes32 itemId = computeItemId(code);
    require(_exists[itemId], "ITEM_NOT_FOUND");
    require(status != BaseItem.InspectionStatus.Unknown, "INVALID_STATUS");

    BaseItem.Item storage item = _items[itemId];
    item.lastInspectionStatus = status;
    item.lastInspectionNotesHash = notesHash;
    item.updatedAt = block.timestamp;
    item.lastUpdatedBy = msg.sender;

    string memory statusStr = status == BaseItem.InspectionStatus.Serviceable ? "Serviceable" : "Unserviceable";

    item.history.push(BaseItem.AuditRecord({
      timestamp: block.timestamp,
      actor: msg.sender,
      action: "INSPECT",
      details: string(abi.encodePacked("Status marked as: ", statusStr))
    }));

    emit ItemInspected(itemId, status, notesHash, msg.sender);
  }
}
