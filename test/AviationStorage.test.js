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
  test("cho phép warehouse đăng ký item", async () => {
    const { viem, aviationStorage, warehouse } = await deployFixture();

    await viem.assertions.emit(
      aviationStorage.write.registerItem(
        ["PN-A320-ELT-0001", "ELT", "HAN-WH-A1", 2n, "ipfs://meta"],
        { account: warehouse.account }
      ),
      aviationStorage,
      "ItemRegistered"
    );

    const item = await aviationStorage.read.getItem(["PN-A320-ELT-0001"]);
    assert.equal(item.code, "PN-A320-ELT-0001");
    assert.equal(item.quantity, 2n);
    assert.equal(item.location, "HAN-WH-A1");
  });

  test("chặn người không có quyền warehouse khi đăng ký", async () => {
    const { viem, aviationStorage, other } = await deployFixture();

    await viem.assertions.revertWith(
      aviationStorage.write.registerItem(["X", "Y", "Z", 1n, ""], { account: other.account }),
      "ONLY_WAREHOUSE"
    );
  });

  test("chặn xuất kho vượt số lượng", async () => {
    const { viem, aviationStorage, warehouse } = await deployFixture();

    await aviationStorage.write.registerItem(["A", "B", "C", 1n, ""], { account: warehouse.account });

    await viem.assertions.revertWith(
      aviationStorage.write.removeStock(["A", 2n, "DEST"], { account: warehouse.account }),
      "INSUFFICIENT_QTY"
    );
  });

  test("cho phép engineer kiểm định và chặn người khác", async () => {
    const { viem, aviationStorage, warehouse, engineer, other } = await deployFixture();

    await aviationStorage.write.registerItem(["A", "B", "C", 1n, ""], { account: warehouse.account });

    await viem.assertions.emit(
      aviationStorage.write.inspectItem(["A", 1, "ipfs://inspection"], { account: engineer.account }),
      aviationStorage,
      "ItemInspected"
    );

    await viem.assertions.revertWith(
      aviationStorage.write.inspectItem(["A", 1, "ipfs://inspection"], { account: other.account }),
      "ONLY_ENGINEER"
    );
  });

  test("cộng kho cập nhật số lượng và có thể cập nhật location", async () => {
    const { aviationStorage, warehouse } = await deployFixture();

    await aviationStorage.write.registerItem(["A", "B", "C", 1n, ""], { account: warehouse.account });
    await aviationStorage.write.addStock(["A", 2n, "NEW"], { account: warehouse.account });

    const item = await aviationStorage.read.getItem(["A"]);
    assert.equal(item.quantity, 3n);
    assert.equal(item.location, "NEW");
  });
});
