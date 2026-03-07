pragma solidity ^0.8.24;

import "./AccessControl.sol";
import "./BaseItem.sol";

contract AviationStorage is AviationAccessControl {
  mapping(bytes32 => BaseItem.Item) private _items;
  mapping(bytes32 => bool) private _exists;

  bytes32[] private _itemIds;

  enum DestinationKind {
    Internal,
    Aircraft
  }

  string[] private _warehouseLocations;
  mapping(bytes32 => bool) private _warehouseLocationExists;
  mapping(bytes32 => bool) private _warehouseLocationEnabled;

  string[] private _destinations;
  mapping(bytes32 => bool) private _destinationExists;
  mapping(bytes32 => bool) private _destinationEnabled;
  mapping(bytes32 => DestinationKind) private _destinationKind;

  bool public policyRequireLocationWhitelisted;
  bool public policyRequireDestinationWhitelisted;
  bool public policyRequireMetadataOnRegister;
  bool public policyRequireNotesOnInspect;
  bool public policyLockOnAircraftDestination;

  event WarehouseLocationSet(string location, bool enabled, address indexed actor);
  event DestinationSet(string destination, DestinationKind kind, bool enabled, address indexed actor);
  event PoliciesSet(
    bool requireLocationWhitelisted,
    bool requireDestinationWhitelisted,
    bool requireMetadataOnRegister,
    bool requireNotesOnInspect,
    bool lockOnAircraftDestination,
    address indexed actor
  );

  constructor() {
    policyLockOnAircraftDestination = true;
  }

  function _key(string memory value) private pure returns (bytes32) {
    return keccak256(bytes(value));
  }

  function _isAircraftDestination(string calldata destination) private pure returns (bool) {
    bytes memory b = bytes(destination);
    uint256 i = 0;
    while (i < b.length && (b[i] == 0x20 || b[i] == 0x09)) {
      i += 1;
    }
    if (b.length < i + 8) return false;
    bytes memory needle = bytes("aircraft");
    for (uint256 j = 0; j < 8; j += 1) {
      uint8 c = uint8(b[i + j]);
      if (c >= 65 && c <= 90) c += 32;
      if (c != uint8(needle[j])) return false;
    }
    return true;
  }

  function setWarehouseLocation(string calldata location, bool enabled) external onlyAdmin {
    require(bytes(location).length != 0, "EMPTY_LOCATION");
    bytes32 k = _key(location);
    if (!_warehouseLocationExists[k]) {
      _warehouseLocationExists[k] = true;
      _warehouseLocations.push(location);
    }
    _warehouseLocationEnabled[k] = enabled;
    emit WarehouseLocationSet(location, enabled, msg.sender);
  }

  function getWarehouseLocationCatalog() external view returns (string[] memory locations, bool[] memory enabled) {
    locations = _warehouseLocations;
    enabled = new bool[](locations.length);
    for (uint256 i = 0; i < locations.length; i += 1) {
      enabled[i] = _warehouseLocationEnabled[_key(locations[i])];
    }
  }

  function getWarehouseLocationsEnabled() external view returns (string[] memory locations) {
    uint256 count = 0;
    for (uint256 i = 0; i < _warehouseLocations.length; i += 1) {
      if (_warehouseLocationEnabled[_key(_warehouseLocations[i])]) count += 1;
    }
    locations = new string[](count);
    uint256 j = 0;
    for (uint256 i = 0; i < _warehouseLocations.length; i += 1) {
      if (_warehouseLocationEnabled[_key(_warehouseLocations[i])]) {
        locations[j] = _warehouseLocations[i];
        j += 1;
      }
    }
  }

  function isWarehouseLocationEnabled(string calldata location) external view returns (bool) {
    return _warehouseLocationEnabled[_key(location)];
  }

  function setDestination(string calldata destination, DestinationKind kind, bool enabled) external onlyAdmin {
    require(bytes(destination).length != 0, "EMPTY_DESTINATION");
    bytes32 k = _key(destination);
    if (!_destinationExists[k]) {
      _destinationExists[k] = true;
      _destinations.push(destination);
    }
    _destinationKind[k] = kind;
    _destinationEnabled[k] = enabled;
    emit DestinationSet(destination, kind, enabled, msg.sender);
  }

  function getDestinationCatalog()
    external
    view
    returns (string[] memory destinations, DestinationKind[] memory kinds, bool[] memory enabled)
  {
    destinations = _destinations;
    kinds = new DestinationKind[](destinations.length);
    enabled = new bool[](destinations.length);
    for (uint256 i = 0; i < destinations.length; i += 1) {
      bytes32 k = _key(destinations[i]);
      kinds[i] = _destinationKind[k];
      enabled[i] = _destinationEnabled[k];
    }
  }

  function getTransferDestinationsEnabled() external view returns (string[] memory destinations) {
    uint256 count = 0;
    for (uint256 i = 0; i < _destinations.length; i += 1) {
      if (_destinationEnabled[_key(_destinations[i])]) count += 1;
    }
    destinations = new string[](count);
    uint256 j = 0;
    for (uint256 i = 0; i < _destinations.length; i += 1) {
      if (_destinationEnabled[_key(_destinations[i])]) {
        destinations[j] = _destinations[i];
        j += 1;
      }
    }
  }

  function getAircraftDestinationsEnabled() external view returns (string[] memory destinations) {
    uint256 count = 0;
    for (uint256 i = 0; i < _destinations.length; i += 1) {
      bytes32 k = _key(_destinations[i]);
      if (_destinationEnabled[k] && _destinationKind[k] == DestinationKind.Aircraft) count += 1;
    }
    destinations = new string[](count);
    uint256 j = 0;
    for (uint256 i = 0; i < _destinations.length; i += 1) {
      bytes32 k = _key(_destinations[i]);
      if (_destinationEnabled[k] && _destinationKind[k] == DestinationKind.Aircraft) {
        destinations[j] = _destinations[i];
        j += 1;
      }
    }
  }

  function getPolicies()
    external
    view
    returns (
      bool requireLocationWhitelisted,
      bool requireDestinationWhitelisted,
      bool requireMetadataOnRegister,
      bool requireNotesOnInspect,
      bool lockOnAircraftDestination
    )
  {
    return (
      policyRequireLocationWhitelisted,
      policyRequireDestinationWhitelisted,
      policyRequireMetadataOnRegister,
      policyRequireNotesOnInspect,
      policyLockOnAircraftDestination
    );
  }

  function setPolicies(
    bool requireLocationWhitelisted,
    bool requireDestinationWhitelisted,
    bool requireMetadataOnRegister,
    bool requireNotesOnInspect,
    bool lockOnAircraftDestination
  ) external onlyAdmin {
    policyRequireLocationWhitelisted = requireLocationWhitelisted;
    policyRequireDestinationWhitelisted = requireDestinationWhitelisted;
    policyRequireMetadataOnRegister = requireMetadataOnRegister;
    policyRequireNotesOnInspect = requireNotesOnInspect;
    policyLockOnAircraftDestination = lockOnAircraftDestination;
    emit PoliciesSet(
      requireLocationWhitelisted,
      requireDestinationWhitelisted,
      requireMetadataOnRegister,
      requireNotesOnInspect,
      lockOnAircraftDestination,
      msg.sender
    );
  }

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
    require(bytes(location).length != 0, "EMPTY_LOCATION");
    if (policyRequireLocationWhitelisted) {
      require(_warehouseLocationEnabled[_key(location)], "LOCATION_NOT_ALLOWED");
    }
    if (policyRequireMetadataOnRegister) {
      require(bytes(metadataHash).length != 0, "METADATA_REQUIRED");
    }

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
    item.isFinalized = false;

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
    require(!item.isFinalized, "ITEM_FINALIZED");
    
    // STRICT LOGIC: Prevent transfer if NOT serviceable (phải được kiểm định Tốt thì mới được chuyển)
    require(item.lastInspectionStatus == BaseItem.InspectionStatus.Serviceable, "NOT_SERVICEABLE_YET");

    bytes32 dKey = _key(destination);
    if (policyRequireDestinationWhitelisted) {
      require(_destinationEnabled[dKey], "DESTINATION_NOT_ALLOWED");
    }

    item.location = destination;
    item.updatedAt = block.timestamp;
    item.lastUpdatedBy = msg.sender;
    if (policyLockOnAircraftDestination) {
      bool known = _destinationExists[dKey];
      bool isAircraft = known ? (_destinationKind[dKey] == DestinationKind.Aircraft) : _isAircraftDestination(destination);
      if (isAircraft) item.isFinalized = true;
    }

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
    require(!item.isFinalized, "ITEM_FINALIZED");
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
    if (policyRequireNotesOnInspect) {
      require(bytes(notesHash).length != 0, "NOTES_REQUIRED");
    }

    BaseItem.Item storage item = _items[itemId];
    require(!item.isFinalized, "ITEM_FINALIZED");
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

  event ItemScrapped(
    bytes32 indexed itemId,
    address indexed actor
  );

  event ItemDemounted(
    bytes32 indexed itemId,
    string newLocation,
    address indexed actor
  );

  function scrapItem(string calldata code) external onlyEngineer {
    bytes32 itemId = computeItemId(code);
    require(_exists[itemId], "ITEM_NOT_FOUND");
    
    BaseItem.Item storage item = _items[itemId];
    require(!item.isFinalized, "ITEM_FINALIZED");
    require(item.lastInspectionStatus != BaseItem.InspectionStatus.Scrapped, "ALREADY_SCRAPPED");

    item.lastInspectionStatus = BaseItem.InspectionStatus.Scrapped;
    item.isFinalized = true;
    item.updatedAt = block.timestamp;
    item.lastUpdatedBy = msg.sender;

    item.history.push(BaseItem.AuditRecord({
      timestamp: block.timestamp,
      actor: msg.sender,
      action: "SCRAP",
      details: "Item permanently scrapped/destroyed."
    }));

    emit ItemScrapped(itemId, msg.sender);
  }

  function demountItem(string calldata code, string calldata newLocation) external onlyEngineer {
    bytes32 itemId = computeItemId(code);
    require(_exists[itemId], "ITEM_NOT_FOUND");
    require(bytes(newLocation).length != 0, "EMPTY_LOCATION");

    BaseItem.Item storage item = _items[itemId];
    require(item.isFinalized, "NOT_ON_AIRCRAFT");
    require(item.lastInspectionStatus != BaseItem.InspectionStatus.Scrapped, "ITEM_SCRAPPED");

    if (policyRequireLocationWhitelisted) {
      require(_warehouseLocationEnabled[_key(newLocation)], "LOCATION_NOT_ALLOWED");
    }

    item.isFinalized = false;
    item.location = newLocation;
    item.lastInspectionStatus = BaseItem.InspectionStatus.Unserviceable; // Force re-inspection
    item.updatedAt = block.timestamp;
    item.lastUpdatedBy = msg.sender;

    item.history.push(BaseItem.AuditRecord({
      timestamp: block.timestamp,
      actor: msg.sender,
      action: "DEMOUNT",
      details: string(abi.encodePacked("Removed from aircraft to: ", newLocation))
    }));

    emit ItemDemounted(itemId, newLocation, msg.sender);
  }
}
