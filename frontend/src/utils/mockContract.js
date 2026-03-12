// Mock data for demo without blockchain
const mockItems = {
  "ENG-001": {
    code: "ENG-001",
    partNumber: "PN-ENGINE-001",
    serialNumber: "SN-ENG-2024-001",
    name: "Engine Compressor Blade Assembly",
    location: "Demo Warehouse A",
    metadataHash: "QmMockEngine001",
    lastInspectionStatus: 1,
    lastInspectionNotesHash: "QmMockNotes001",
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 30,
    updatedAt: Math.floor(Date.now() / 1000) - 86400 * 5,
    lastUpdatedBy: "0x1234567890123456789012345678901234567890",
    isFinalized: false,
    history: [
      {
        timestamp: Math.floor(Date.now() / 1000) - 86400 * 30,
        actor: "0x1234567890123456789012345678901234567890",
        action: "REGISTERED",
        details: "Item registered at Demo Warehouse A (TX: 0xmock1234567890abcdef)",
      },
      {
        timestamp: Math.floor(Date.now() / 1000) - 86400 * 10,
        actor: "0x1234567890123456789012345678901234567890",
        action: "INSPECTED",
        details: "Inspection completed - Status: Serviceable (TX: 0xmock0987654321fedcba)",
      },
    ],
  },
  "HYD-002": {
    code: "HYD-002",
    partNumber: "PN-HYDRAULIC-002",
    serialNumber: "SN-HYD-2024-002",
    name: "Hydraulic Pump Assembly",
    location: "Demo Warehouse B",
    metadataHash: "QmMockHydraulic002",
    lastInspectionStatus: 0,
    lastInspectionNotesHash: "",
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 20,
    updatedAt: Math.floor(Date.now() / 1000) - 86400 * 20,
    lastUpdatedBy: "0x1234567890123456789012345678901234567890",
    isFinalized: false,
    history: [
      {
        timestamp: Math.floor(Date.now() / 1000) - 86400 * 20,
        actor: "0x1234567890123456789012345678901234567890",
        action: "REGISTERED",
        details: "Item registered at Demo Warehouse B (TX: 0xmockabcdef1234567890)",
      },
    ],
  },
  "ELE-003": {
    code: "ELE-003",
    partNumber: "PN-ELECTRICAL-003",
    serialNumber: "SN-ELE-2024-003",
    name: "Electrical Control Unit",
    location: "Demo Warehouse C",
    metadataHash: "QmMockElectrical003",
    lastInspectionStatus: 2,
    lastInspectionNotesHash: "QmMockNotes003",
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 15,
    updatedAt: Math.floor(Date.now() / 1000) - 86400 * 3,
    lastUpdatedBy: "0x1234567890123456789012345678901234567890",
    isFinalized: false,
    history: [
      {
        timestamp: Math.floor(Date.now() / 1000) - 86400 * 15,
        actor: "0x1234567890123456789012345678901234567890",
        action: "REGISTERED",
        details: "Item registered at Demo Warehouse C (TX: 0xmockfedcba9876543210)",
      },
      {
        timestamp: Math.floor(Date.now() / 1000) - 86400 * 3,
        actor: "0x1234567890123456789012345678901234567890",
        action: "INSPECTED",
        details: "Inspection completed - Status: Unserviceable (TX: 0xmock1111111111111111)",
      },
    ],
  },
};

const mockLocations = ["Demo Warehouse A", "Demo Warehouse B", "Demo Warehouse C", "Demo Storage 1", "Demo Storage 2"];
const mockDestinations = ["Demo Aircraft 1", "Demo Aircraft 2", "Demo Hangar", "Demo Scrap"];

export function createMockContract() {
  let items = { ...mockItems };
  let itemIds = Object.keys(items);

  return {
    async getItem(code) {
      const trimmedCode = String(code ?? "").trim();
      if (!items[trimmedCode]) {
        throw new Error(`Item ${trimmedCode} not found`);
      }
      return items[trimmedCode];
    },

    async getItemById(itemId) {
      const code = itemId.slice(2).replace(/0+$/, '') || "ENG-001";
      return this.getItem(code);
    },

    async itemCount() {
      return itemIds.length;
    },

    async itemIdAt(index) {
      if (index >= itemIds.length) throw new Error("Index out of bounds");
      const code = itemIds[index];
      return "0x" + code.padEnd(64, "0").slice(0, 64);
    },

    async getWarehouseLocationsEnabled() {
      return mockLocations;
    },

    async getTransferDestinationsEnabled() {
      return mockDestinations;
    },

    async getPolicies() {
      return [true, true, false, false, false];
    },

    async registerItem(code, partNumber, serialNumber, name, location, metadataHash) {
      const trimmedCode = String(code ?? "").trim();
      if (items[trimmedCode]) {
        throw new Error(`Item ${trimmedCode} already exists`);
      }

      const txHash = "0xmock" + Math.random().toString(16).slice(2).padEnd(64, "0").slice(0, 64);
      items[trimmedCode] = {
        code: trimmedCode,
        partNumber,
        serialNumber,
        name,
        location,
        metadataHash: metadataHash ?? "",
        lastInspectionStatus: 0,
        lastInspectionNotesHash: "",
        createdAt: Math.floor(Date.now() / 1000),
        updatedAt: Math.floor(Date.now() / 1000),
        lastUpdatedBy: "0x1234567890123456789012345678901234567890",
        isFinalized: false,
        history: [
          {
            timestamp: Math.floor(Date.now() / 1000),
            actor: "0x1234567890123456789012345678901234567890",
            action: "REGISTERED",
            details: `Item registered at ${location} (TX: ${txHash})`,
          },
        ],
      };

      if (!itemIds.includes(trimmedCode)) {
        itemIds.push(trimmedCode);
      }

      return {
        hash: txHash,
        wait: async () => ({ hash: txHash })
      };
    },

    async transferItem(code, destination) {
      const trimmedCode = String(code ?? "").trim();
      if (!items[trimmedCode]) {
        throw new Error(`Item ${trimmedCode} not found`);
      }

      const txHash = "0xmock" + Math.random().toString(16).slice(2).padEnd(64, "0").slice(0, 64);
      items[trimmedCode].history.push({
        timestamp: Math.floor(Date.now() / 1000),
        actor: "0x1234567890123456789012345678901234567890",
        action: "TRANSFERRED",
        details: `Item transferred to ${destination} (TX: ${txHash})`,
      });

      return {
        hash: txHash,
        wait: async () => ({ hash: txHash })
      };
    },

    async updateLocation(code, newLocation) {
      const trimmedCode = String(code ?? "").trim();
      if (!items[trimmedCode]) {
        throw new Error(`Item ${trimmedCode} not found`);
      }

      const txHash = "0xmock" + Math.random().toString(16).slice(2).padEnd(64, "0").slice(0, 64);
      items[trimmedCode].location = newLocation;
      items[trimmedCode].updatedAt = Math.floor(Date.now() / 1000);
      items[trimmedCode].history.push({
        timestamp: Math.floor(Date.now() / 1000),
        actor: "0x1234567890123456789012345678901234567890",
        action: "LOCATION_UPDATED",
        details: `Location updated to ${newLocation} (TX: ${txHash})`,
      });

      return {
        hash: txHash,
        wait: async () => ({ hash: txHash })
      };
    },

    async scrapItem(code) {
      const trimmedCode = String(code ?? "").trim();
      if (!items[trimmedCode]) {
        throw new Error(`Item ${trimmedCode} not found`);
      }

      const txHash = "0xmock" + Math.random().toString(16).slice(2).padEnd(64, "0").slice(0, 64);
      items[trimmedCode].isFinalized = true;
      items[trimmedCode].history.push({
        timestamp: Math.floor(Date.now() / 1000),
        actor: "0x1234567890123456789012345678901234567890",
        action: "SCRAPPED",
        details: `Item scrapped (TX: ${txHash})`,
      });

      return {
        hash: txHash,
        wait: async () => ({ hash: txHash })
      };
    },

    async demountItem(code, newLocation) {
      const trimmedCode = String(code ?? "").trim();
      if (!items[trimmedCode]) {
        throw new Error(`Item ${trimmedCode} not found`);
      }

      const txHash = "0xmock" + Math.random().toString(16).slice(2).padEnd(64, "0").slice(0, 64);
      items[trimmedCode].location = newLocation;
      items[trimmedCode].history.push({
        timestamp: Math.floor(Date.now() / 1000),
        actor: "0x1234567890123456789012345678901234567890",
        action: "DEMOUNTED",
        details: `Item demounted to ${newLocation} (TX: ${txHash})`,
      });

      return {
        hash: txHash,
        wait: async () => ({ hash: txHash })
      };
    },

    async inspectItem(code, status, notesHash) {
      const trimmedCode = String(code ?? "").trim();
      if (!items[trimmedCode]) {
        throw new Error(`Item ${trimmedCode} not found`);
      }

      const txHash = "0xmock" + Math.random().toString(16).slice(2).padEnd(64, "0").slice(0, 64);
      items[trimmedCode].lastInspectionStatus = status;
      items[trimmedCode].lastInspectionNotesHash = notesHash ?? "";
      items[trimmedCode].updatedAt = Math.floor(Date.now() / 1000);
      items[trimmedCode].history.push({
        timestamp: Math.floor(Date.now() / 1000),
        actor: "0x1234567890123456789012345678901234567890",
        action: "INSPECTED",
        details: `Inspection completed - Status: ${status === 1 ? "Serviceable" : "Unserviceable"} (TX: ${txHash})`,
      });

      return {
        hash: txHash,
        wait: async () => ({ hash: txHash })
      };
    },

    async wait() {
      return { hash: "0xmock" + Math.random().toString(16).slice(2) };
    },
  };
}
