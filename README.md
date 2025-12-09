# TON Starter Kit

A starter kit for working with Chainlink CCIP cross-chain messaging between TON and EVM chains.

## Table of Contents

- [Environment Context](#environment-context)
- [Repo Structure](#repo-structure)
- [Prerequisites](#prerequisites)
- [TON Wallet Setup](#ton-wallet-setup)
- [Getting Test Funds](#getting-test-funds)
- [Tutorial](#tutorial)
  - [Step 0: Deploy Receiver Contracts](#step-0-deploy-receiver-contracts)
  - [Step 1: Send Message from EVM to TON](#step-1-send-message-from-evm-to-ton)
  - [Step 2: Send Message from TON to EVM](#step-2-send-message-from-ton-to-evm)
- [Network Information](#network-information)
- [Token Transfers](#token-transfers)
- [Fee Payments](#fee-payments)
- [Key Implementation Details](#key-implementation-details)
- [Troubleshooting](#troubleshooting)
- [Configuration Reference](#configuration-reference)
- [Resources](#resources)

## Environment Context

> ⚠️ **Staging Environment Notice**
> 
> This starter kit targets the **non-production staging environment**. While high uptime is a goal, it does not carry production-level SLAs.
> 
> - **Redeployments may occur**, potentially changing contract addresses
> - **Critical updates** (including address changes) will be communicated via designated channels
> - **Current functionality** is limited to arbitrary messaging
> - **Token transfers** will be integrated in a future release

## Repo Structure

There are 3 main folders in the repo: **contracts**, **scripts**, and **chainlink-ton**.

### Contracts
The `contracts/` directory contains smart contracts for both chains:
- `MessageReceiver.sol` - EVM receiver contract that implements the CCIP `IAny2EVMMessageReceiver` interface
- `MessageReceiver.tolk` - TON receiver contract that handles CCIP messages and sends confirmation

### Scripts
The scripts are organized by cross-chain direction. For a deep dive into how these scripts handle **encoding**, **decoding**, and **byte-level execution**, please read the [**Script Execution Guide**](./scripts/README.md).

- **`scripts/evm2ton/`** - Scripts for sending messages from EVM → TON
- **`scripts/ton2evm/`** - Scripts for sending messages from TON → EVM  
- **`scripts/utils/`** - Helper scripts for checking message status
- **`scripts/deploy/`** - Contract deployment scripts

### chainlink-ton
Internal dependency providing TON contract wrappers, types, and TL-B bindings for CCIP interactions. This submodule contains the official TON smart contract implementations and TypeScript interfaces.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and npm installed
- **TON wallet** with testnet funds and **24-word mnemonic** (see [TON Wallet Setup](#ton-wallet-setup))
- **EVM wallet** with Sepolia ETH (see [Getting Test Funds](#getting-test-funds))
- Basic understanding of CCIP messaging concepts

## TON Wallet Setup

To interact with TON testnet, you need a wallet and its 24-word recovery phrase (mnemonic).

1. Download [TON Keeper](https://tonkeeper.com/) on iOS or Android
2. Create a new wallet and **save your 24-word recovery phrase** - this is your `TON_MNEMONIC`
3. Switch to testnet: Settings (gear icon) → Dev Menu → Switch to Testnet
4. Select the **V4R2** wallet version (the scripts use WalletContractV4)
5. Copy your V4R2 wallet address for receiving testnet funds

> **Note**: TON Keeper shows multiple addresses (V3R1, V3R2, V4R2, W5) from the same mnemonic. Each wallet version has a different address. This starter kit uses **V4R2**.

## Getting Test Funds

### EVM Sepolia Faucets
- [Chainlink Sepolia Faucet](https://faucets.chain.link/sepolia)
- [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
- [Google Cloud Sepolia Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)

### TON Testnet Faucets
- **Telegram Bot**: [@testgiver_ton_bot](https://t.me/testgiver_ton_bot) - Primary faucet for TON testnet
- [Chainstack TON Faucet](https://faucet.chainstack.com/ton-testnet-faucet)

## Tutorial

This tutorial will guide you through deploying receiver contracts and sending cross-chain messages in both directions.

### Step 0: Deploy Receiver Contracts

Before sending messages, you need to deploy receiver contracts on both chains.

#### 0.1 Clone and Install

```bash
git clone https://github.com/smartcontractkit/ton-starter-kit.git
cd ton-starter-kit
npm install
```

#### 0.2 Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values. All variables are documented with comments in `.env.example`.

#### 0.3 Get Test Funds

- **Sepolia ETH**: Visit [Chainlink Faucet](https://faucets.chain.link/sepolia)
- **TON Testnet**: Message [@testgiver_ton_bot](https://t.me/testgiver_ton_bot) on Telegram

#### 0.4 Deploy EVM Receiver (Sepolia)

**Using Hardhat (Recommended)**

```bash
npm run deploy:evm
```

After deployment, add the contract address to your `.env` file as `EVM_RECEIVER_ADDRESS`.

**Using Remix (Alternative)**

1. Open [Remix IDE](https://remix.ethereum.org)
2. Create a new file `MessageReceiver.sol` and copy contents from `contracts/MessageReceiver.sol`
3. Compile with Solidity 0.8.24
4. Deploy to Sepolia with constructor parameter: `0xEA5d21863357870Be141b318A4d4E9709Ac3F5ce` (Sepolia Router)
5. Add deployed address to `.env` as `EVM_RECEIVER_ADDRESS`

#### 0.5 Deploy TON Receiver

```bash
npm run deploy:ton
```

This will:
1. Compile the `MessageReceiver.tolk` contract
2. Deploy it to TON Testnet with the OffRamp address
3. Output the deployed contract address

After deployment, add the contract address to your `.env` file as `TON_RECEIVER_ADDRESS`.

**Verify on TON Explorer**

View your deployed contract at:
```
https://testnet.tonviewer.com/<YOUR_CONTRACT_ADDRESS>
```

**Note:** The TON deployment script requires:
- `TON_MNEMONIC` in your `.env` file
- At least 0.5 TON in your wallet for deployment gas fees

### Step 1: Send Message from EVM to TON

**Time Required:** ~20 minutes (including 15 minutes for CCIP delivery)

**What You'll Need:**
- Sepolia ETH (at least 0.01 ETH for gas)
- TON receiver deployed (from Step 0.5)
- `TON_RECEIVER_ADDRESS` set in `.env`

**Steps:**

1. **Send a message from EVM to TON**:
   ```bash
   npm run evm2ton:send
   ```
   
   You will see output like:
   ```
   ✅ Transaction confirmed in block: 9477779
   📋 Message ID: 0x000...
   ⏳ Expected delivery: 5-15 minutes
   ```

2. **Wait for CCIP delivery** (5-15 minutes)

3. **Check the message on TON**:
   ```bash
   npm run utils:checkTON
   ```
   
   Expected output:
   ```
   ✅ Latest message received
   📋 Message ID: 0x000...
   📝 Data: Hello TON from EVM
   ```

4. **Track on CCIP Explorer** (Optional):
   
   Use the **source EVM transaction hash** from step 1 to track delivery:
   ```
   https://ccip.chain.link/tx/<EVM_TX_HASH>
   ```

> **NOTE**: Since end-to-end transaction time depends primarily on the time to finality on the source blockchain (Ethereum Sepolia in this case), it's recommended to wait 5-15 minutes before checking the message status.

### Step 2: Send Message from TON to EVM

**Time Required:** ~20 minutes (including 15 minutes for CCIP delivery)

**What You'll Need:**
- TON testnet funds (at least 0.1 TON for sending messages)
- EVM receiver deployed (from Step 0.4)
- `EVM_RECEIVER_ADDRESS` set in `.env`

**Steps:**

1. **Send a message from TON to EVM**:
   ```bash
   npm run ton2evm:send
   ```
   
   You will see output like:
   ```
   ✅ Transaction submitted!
   📋 Hash: 0x397dac...
   ⏳ Expected delivery: 5-15 minutes
   ```

2. **Wait for CCIP delivery** (5-15 minutes)

3. **Check the message on EVM**:
   ```bash
   npm run utils:checkEVM
   ```
   
   Expected output:
   ```
   ✅ Latest message received
   📋 Message ID: 0x000...
   📝 Data: Hello EVM from TON
   🔗 Source: TON Testnet (1399300952838017768)
   🔗 TX Hash: 0xabc123...  <- Use this for CCIP Explorer
   ```

4. **Track on CCIP Explorer** (Optional):
   
   For TON → EVM, use the **destination EVM transaction hash** from step 3:
   ```
   https://ccip.chain.link/tx/<DESTINATION_EVM_TX_HASH>
   ```
   
   > **Note**: TON source transaction hash support on CCIP Explorer is coming soon. For now, run `npm run utils:checkEVM` to find the destination EVM transaction hash where the message was delivered.

## Network Information

### Staging Environment

| Chain | Network | Chain Selector | Router Address |
|-------|---------|----------------|----------------|
| **EVM** | Sepolia Testnet | `16015286601757825753` | `0xEA5d21863357870Be141b318A4d4E9709Ac3F5ce` |
| **TON** | TON Testnet | `1399300952838017768` | `EQDrkhDYT8czFZuYNPlFMJ5ICD8FQoEW0b1KvITMVljC3ZTV` |

### Additional Components

| Component | EVM (Sepolia) | TON (Testnet) |
|-----------|---------------|---------------|
| **OnRamp** | `0xFB34b9969Dd201cc9A04E604a6D40AF917b6C1E8` | `EQDTIBzONmN64tMmLymf0-jtc_AAWfDlXiZcr7ja5ri7ak53` |
| **OffRamp** | `0x93Bb167Ebd91987f9Dff6B954b9Eead469d2b849` | `EQCfLpla6865euCU2-TPlzy8vKQKT8rFKHoAvorKBC1RudIO` |

### Block Explorers
- **Sepolia**: https://sepolia.etherscan.io
- **TON Testnet**: https://testnet.tonviewer.com or https://testnet.tonscan.org

## Token Transfers

### TON → EVM Token Transfer

> 🚧 **Coming Soon** - Token transfer functionality will be available in a future release.

**Planned features:**
- Transfer CCIP-BnM test tokens from TON to EVM chains
- Support for multiple token types
- Atomic message + token transfers

### EVM → TON Token Transfer

> 🚧 **Coming Soon** - Token transfer functionality will be available in a future release.

**Planned features:**
- Transfer CCIP-BnM test tokens from EVM chains to TON
- Bridge tokens across multiple EVM chains via TON
- Programmable token transfers with data

## Fee Payments

### Current: Native Token Payments (TON → EVM)

Currently, fees for TON → EVM messages are paid in **native TON tokens**. The fee token address is:

```
0:0000000000000000000000000000000000000000000000000000000000000001
```

Message value starts at **0.05 TON** and should be increased for complex receiver logic.

### Future: LINK Token Support

> 🚧 **Coming Soon** - LINK token payment support will be available in a future release.

**Planned features:**
- Pay CCIP fees using LINK tokens on TON
- Consistent cross-chain fee payment experience
- Fee estimation tools for LINK payments

## Key Implementation Details

### TON → EVM Address Encoding

EVM addresses must be **left-padded to 32 bytes**:

```typescript
const addressBytes = Buffer.from(evmAddress.slice(2), 'hex'); // 20 bytes
const paddedAddress = Buffer.concat([
  Buffer.alloc(12, 0),  // 12 zero bytes
  addressBytes          // 20-byte address
]); // Total: 32 bytes
```

### EVM → TON Address Encoding

TON addresses must be **36 bytes total**:

```typescript
// 4-byte workchain (int32, big-endian) + 32-byte account hash
const workchainBytes = new Uint8Array(4);
new DataView(workchainBytes.buffer).setInt32(0, tonAddr.workChain, false);
const receiverBytes = ethers.concat([
  workchainBytes,  // 4 bytes
  accountId        // 32 bytes
]); // Total: 36 bytes
```

### ExtraArgs Encoding (TON → EVM)

The `gasLimit` field is **optional** and must be encoded using the `storeMaybeUint` pattern:

```typescript
const extraArgs = beginCell()
  .storeUint(0x181dcf10, 32)     // Version tag for GenericExtraArgsV2
  .storeBit(true)                // ✅ "gasLimit is present" bit
  .storeUint(1000000, 256)       // gasLimit value
  .storeBit(true)                // allowOutOfOrderExecution
  .endCell();
```

**Critical:** Always include `.storeBit(true)` before storing the optional `gasLimit` value. Omitting this causes **exit code 9 (Cell Underflow)**.

### ExtraArgs Encoding (EVM → TON)

For TON destinations, `allowOutOfOrderExecution` **must be `true`**:

```typescript
const extraArgs = ethers.AbiCoder.defaultAbiCoder().encode(
  ['uint256', 'bool'],
  [1000000, true]  // ✅ MUST be true for TON
);
```

## Troubleshooting

### Common Issues

| Chain | Symptom | Cause | Fix |
|-------|---------|-------|-----|
| **EVM** | "Insufficient fee" revert | Gas limit too low or fee estimation failed | Increase `gasLimit` in `extraArgs`; Add 10-20% buffer to fee quote |
| **EVM** | Message not received | Invalid receiver address format | Verify 36-byte encoding for TON addresses (4-byte workchain + 32-byte hash) |
| **TON** | Exit code 9 (Cell Underflow) | Malformed Cell structure or missing "maybe" bit | Check `extraArgs` encoding: ensure `.storeBit(true)` before optional `gasLimit` |
| **TON** | Exit code 258 (FeeTokenNotSupported) | Wrong fee token address | Use `0:0000...0001` (NOT `...0000`) |
| **TON** | Exit code 0xFFFF (Wrong Opcode) | Message sent to wrong contract | Verify Router and receiver addresses |
| **Both** | Delayed delivery (>15 min) | Staging environment slow processing | Wait up to 20-30 minutes; Contact Chainlink Labs if persistent |

## Configuration Reference

All network constants are defined in `config/constants.ts`:

```typescript
export const SEPOLIA_CHAIN_SELECTOR = 16015286601757825753n;
export const TON_CHAIN_SELECTOR = 1399300952838017768n;

export const SEPOLIA_ROUTER = '0xEA5d21863357870Be141b318A4d4E9709Ac3F5ce';
export const TON_ROUTER = 'EQDrkhDYT8czFZuYNPlFMJ5ICD8FQoEW0b1KvITMVljC3ZTV';

export const TON_FEE_TOKEN = '0:0000000000000000000000000000000000000000000000000000000000000001';
```

## Resources

- [Chainlink CCIP Documentation](https://docs.chain.link/ccip)
- [TON Documentation](https://docs.ton.org)
- [@ton/core NPM Package](https://www.npmjs.com/package/@ton/core)
- [TON Utils Go Library](https://github.com/xssnick/tonutils-go)
- [ethers.js Documentation](https://docs.ethers.org)

## License

MIT

## Disclaimer

This tutorial represents an educational example to use a Chainlink system, product, or service and is provided to demonstrate how to interact with Chainlink's systems, products, and services to integrate them into your own. This template is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, it has not been audited, and it may be missing key checks or error handling to make the usage of the system, product or service more clear. Do not use the code in this example in a production environment without completing your own audits and application of best practices. Neither Chainlink Labs, the Chainlink Foundation, nor Chainlink node operators are responsible for unintended outputs that are generated due to errors in code.
