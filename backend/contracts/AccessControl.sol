pragma solidity ^0.8.24;

abstract contract AviationAccessControl {
  address private _admin;

  mapping(address => bool) private _warehouseStaff;
  mapping(address => bool) private _engineers;

  event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);
  event WarehouseStaffSet(address indexed account, bool enabled);
  event EngineerSet(address indexed account, bool enabled);

  constructor() {
    _admin = msg.sender;
    _warehouseStaff[msg.sender] = true;
    _engineers[msg.sender] = true;
  }

  modifier onlyAdmin() {
    require(msg.sender == _admin, "ONLY_ADMIN");
    _;
  }

  modifier onlyWarehouseStaff() {
    require(_warehouseStaff[msg.sender], "ONLY_WAREHOUSE");
    _;
  }

  modifier onlyEngineer() {
    require(_engineers[msg.sender], "ONLY_ENGINEER");
    _;
  }

  function admin() public view returns (address) {
    return _admin;
  }

  function isWarehouseStaff(address account) public view returns (bool) {
    return _warehouseStaff[account];
  }

  function isEngineer(address account) public view returns (bool) {
    return _engineers[account];
  }

  function transferAdmin(address newAdmin) external onlyAdmin {
    require(newAdmin != address(0), "ZERO_ADDRESS");

    address previousAdmin = _admin;
    _admin = newAdmin;
    emit AdminTransferred(previousAdmin, newAdmin);
  }

  function setWarehouseStaff(address account, bool enabled) external onlyAdmin {
    require(account != address(0), "ZERO_ADDRESS");
    _warehouseStaff[account] = enabled;
    emit WarehouseStaffSet(account, enabled);
  }

  function setEngineer(address account, bool enabled) external onlyAdmin {
    require(account != address(0), "ZERO_ADDRESS");
    _engineers[account] = enabled;
    emit EngineerSet(account, enabled);
  }
}

