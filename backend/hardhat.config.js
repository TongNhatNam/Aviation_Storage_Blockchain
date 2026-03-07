import { defineConfig } from "hardhat/config";
import hardhatNodeTestRunner from "@nomicfoundation/hardhat-node-test-runner";
import hardhatViem from "@nomicfoundation/hardhat-viem";
import hardhatViemAssertions from "@nomicfoundation/hardhat-viem-assertions";

const ganachePort = (() => {
  const raw = process.env.GANACHE_PORT;
  const port = raw ? Number(raw) : 8787;
  return Number.isFinite(port) ? port : 8787;
})();

const ganacheUrl = `http://127.0.0.1:${ganachePort}`;

export default defineConfig({
  plugins: [hardhatNodeTestRunner, hardhatViem, hardhatViemAssertions],
  solidity: {
    version: "0.8.24",
    settings: {
      viaIR: true,
      evmVersion: "paris",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      type: "http",
      url: ganacheUrl,
    },
    ganache: {
      type: "http",
      url: ganacheUrl,
      chainId: 1337,
    },
  },
});
