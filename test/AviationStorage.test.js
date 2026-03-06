import assert from "node:assert/strict";
import test from "node:test";
import hre from "hardhat";

async function deployFixture() {
  const { viem } = await hre.network.connect();
  const [admin, warehouse, engineer, other] = await viem.getWalletClients();
  const aviationStorage = await viem.deployContract("AviationStorage");

  await aviationStorage.write.setWarehouseStaff([warehouse.account.address, true], {
    account: admin.account,
  });
  await aviationStorage.write.setEngineer([engineer.account.address, true], {
    account: admin.account,
  });

  return { viem, aviationStorage, admin, warehouse, engineer, other };
}

test.describe("AviationStorage", () => {
  test("admin cấu hình danh mục và policy (master data + enforcement)", async () => {
    const { viem, aviationStorage, admin, warehouse, engineer } = await deployFixture();

    await aviationStorage.write.setWarehouseLocation(["HAN-WH-A1", true], { account: admin.account });
    await aviationStorage.write.setWarehouseLocation(["SGN-WH-B3", true], { account: admin.account });

    const locations = await aviationStorage.read.getWarehouseLocationsEnabled();
    assert.equal(locations.includes("HAN-WH-A1"), true);

    await aviationStorage.write.setDestination(["Hangar 1 - HAN", 0, true], { account: admin.account });
    await aviationStorage.write.setDestination(["Aircraft VN-A899 (A350)", 1, true], { account: admin.account });

    const aircrafts = await aviationStorage.read.getAircraftDestinationsEnabled();
    assert.equal(aircrafts.includes("Aircraft VN-A899 (A350)"), true);

    await aviationStorage.write.setPolicies([true, true, true, true, true], { account: admin.account });

    await viem.assertions.revertWith(
      aviationStorage.write.registerItem(["X", "PN", "SN", "Name", "UNKNOWN-LOC", ""], { account: warehouse.account }),
      "LOCATION_NOT_ALLOWED"
    );

    await viem.assertions.revertWith(
      aviationStorage.write.registerItem(["X", "PN", "SN", "Name", "HAN-WH-A1", ""], { account: warehouse.account }),
      "METADATA_REQUIRED"
    );

    await aviationStorage.write.registerItem(["X", "PN", "SN", "Name", "HAN-WH-A1", "ipfs://meta"], { account: warehouse.account });

    await viem.assertions.revertWith(
      aviationStorage.write.inspectItem(["X", 1, ""], { account: engineer.account }),
      "NOTES_REQUIRED"
    );

    await aviationStorage.write.inspectItem(["X", 1, "ipfs://notes"], { account: engineer.account });

    await viem.assertions.revertWith(
      aviationStorage.write.transferItem(["X", "UNKNOWN-DEST"], { account: warehouse.account }),
      "DESTINATION_NOT_ALLOWED"
    );

    await aviationStorage.write.transferItem(["X", "Aircraft VN-A899 (A350)"], { account: warehouse.account });

    const item = await aviationStorage.read.getItem(["X"]);
    assert.equal(item.isFinalized, true);
  });

  test("cho phép warehouse đăng ký item", async () => {
    const { viem, aviationStorage, warehouse } = await deployFixture();

    await viem.assertions.emit(
      aviationStorage.write.registerItem(
        ["PN-A320-ELT-0001", "ELT", "0001", "Item Name", "HAN-WH-A1", "ipfs://meta"],
        { account: warehouse.account }
      ),
      aviationStorage,
      "ItemRegistered"
    );

    const item = await aviationStorage.read.getItem(["PN-A320-ELT-0001"]);
    assert.equal(item.code, "PN-A320-ELT-0001");
    assert.equal(item.location, "HAN-WH-A1");
    // status is 0 (Unknown)
    assert.equal(item.lastInspectionStatus, 0);
  });

  test("chặn xuất kho nếu thiết bị chưa được kiểm định Serviceable", async () => {
    const { viem, aviationStorage, warehouse } = await deployFixture();

    await aviationStorage.write.registerItem(["A", "B", "C", "D", "E", ""], { account: warehouse.account });

    // Try to transfer while status is Unknown (0), should revert with NOT_SERVICEABLE_YET
    await viem.assertions.revertWith(
      aviationStorage.write.transferItem(["A", "DEST"], { account: warehouse.account }),
      "NOT_SERVICEABLE_YET"
    );
  });

  test("cho phép engineer kiểm định và warehouse transfer sau khi serviceable", async () => {
    const { viem, aviationStorage, warehouse, engineer } = await deployFixture();

    await aviationStorage.write.registerItem(["A", "B", "C", "D", "E", ""], { account: warehouse.account });

    // Inspect Item - Serviceable (1)
    await viem.assertions.emit(
      aviationStorage.write.inspectItem(["A", 1, "ipfs://inspection"], { account: engineer.account }),
      aviationStorage,
      "ItemInspected"
    );

    const item = await aviationStorage.read.getItem(["A"]);
    assert.equal(item.lastInspectionStatus, 1);

    // Transfer should now succeed
    await viem.assertions.emit(
      aviationStorage.write.transferItem(["A", "NEW\_DEST"], { account: warehouse.account }),
      aviationStorage,
      "ItemTransferred"
    );

    const updatedItem = await aviationStorage.read.getItem(["A"]);
    assert.equal(updatedItem.location, "NEW\_DEST");
  });

  test("khoá chỉnh sửa sau khi chuyển lên Aircraft", async () => {
    const { viem, aviationStorage, warehouse, engineer } = await deployFixture();

    await aviationStorage.write.registerItem(["A", "B", "C", "D", "E", ""], { account: warehouse.account });
    await aviationStorage.write.inspectItem(["A", 1, "ipfs://inspection"], { account: engineer.account });

    await viem.assertions.emit(
      aviationStorage.write.transferItem(["A", "Aircraft VN-A899 (A350)"], { account: warehouse.account }),
      aviationStorage,
      "ItemTransferred"
    );

    const item = await aviationStorage.read.getItem(["A"]);
    assert.equal(item.isFinalized, true);

    await viem.assertions.revertWith(
      aviationStorage.write.updateLocation(["A", "HAN-WH-A2"], { account: warehouse.account }),
      "ITEM_FINALIZED"
    );

    await viem.assertions.revertWith(
      aviationStorage.write.transferItem(["A", "Hangar 1 - HAN"], { account: warehouse.account }),
      "ITEM_FINALIZED"
    );

    await viem.assertions.revertWith(
      aviationStorage.write.inspectItem(["A", 2, "ipfs://attempt"], { account: engineer.account }),
      "ITEM_FINALIZED"
    );
  });

  test("chặn người không có quyền warehouse khi đăng ký", async () => {
    const { viem, aviationStorage, other } = await deployFixture();

    await viem.assertions.revertWith(
      aviationStorage.write.registerItem(["X", "Y", "Z", "N", "L", ""], { account: other.account }),
      "ONLY_WAREHOUSE"
    );
  });
});
