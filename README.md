# Chainlink CCIP TON Starter Kit

A starter kit for working with Chainlink CCIP cross-chain messaging between TON and EVM chains.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and npm installed
- **TON wallet** with testnet funds and **24-word mnemonic** (see [TON Wallet Setup](#ton-wallet-setup))
- **EVM wallet** with Sepolia ETH (see [Getting Test Funds](#getting-test-funds))
- Basic understanding of CCIP messaging concepts

## TON Wallet Setup

To interact with TON testnet, you need a wallet and its 24-word recovery phrase (mnemonic).

1. Download [TON Keeper](https://tonkeeper.com/) on iOS or Android
2. On the first run, you'll have to create a new wallet
3. Copy the 24-word recovery phrase by selecting the Gear icon then Backup
4. Select "Back Up Manually" and Continue to save the recovery phrase to a safe location. This is your `TON_MNEMONIC`
5. Go back to the main Wallet screen, select the wallet drop-down, and choose "Add Wallet"
6. Scroll to the bottom and select "Testnet Account"
7. Type in the 24-word recovery phrase you saved earlier and select "Continue"
8. Name the wallet "Testnet Wallet" and select Continue
9. Select the Gear icon and select V4R2 as the wallet version (this starter kit uses V4R2)
10. Save the `TON_MNEMONIC` to your `.env` file in quotes (e.g. `TON_MNEMONIC="..."`)

> **Why V4R2?** V4R2 and W5 are different wallet contract versions on TON. The same mnemonic generates different addresses for each version. CCIP TON infrastructure is built for V4R2. You can add additional versions later via Settings > Active Address.

### Get TON Center API Key

To avoid rate limits when deploying and interacting with TON testnet, get a free API key:

1. Visit the TON Center API Bot: [@tonapibot](https://t.me/tonapibot) on Telegram
2. Send `/start` to the bot
3. Follow the instructions to get your free testnet API key
4. Add it to your `.env` file: `TON_API_KEY="your_api_key_here"`

Without an API key, you will encounter "429 Too Many Requests" errors during deployment.

### Getting Test Funds

#### EVM Sepolia Faucets
- [Chainlink Sepolia Faucet](https://faucets.chain.link/sepolia)
- [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
- [Google Cloud Sepolia Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)

#### TON Testnet Faucets
- **Telegram Bot**: [@testgiver_ton_bot](https://t.me/testgiver_ton_bot) - Primary faucet for TON testnet
- [Chainstack TON Faucet](https://faucet.chainstack.com/ton-testnet-faucet)

## Setup

### Clone and Install

```bash
git clone https://github.com/smartcontractkit/ton-starter-kit.git
cd ton-starter-kit
git submodule update --init --recursive
npm install
```

### Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values:
- `SEPOLIA_PRIVATE_KEY` - Your EVM wallet private key
- `TON_MNEMONIC` - Your 24-word TON wallet mnemonic
- `TON_API_KEY` - Your TON Center API key to avoid rate limits

Then source the `.env` file:

```bash
source .env
```

## Tutorial

This tutorial will guide you through deploying receiver contracts and sending cross-chain messages in both directions.

### Deploy Receiver Contracts

Before sending messages, you need to deploy receiver contracts on both chains.

#### Deploy EVM Receiver (Sepolia)

**Using Hardhat (Recommended)**

```bash
npm run deploy:evm
```

After deployment, add the contract address to your `.env` file as `EVM_RECEIVER_ADDRESS` and source the `.env` file:

```bash
source .env
```

#### Deploy TON Receiver

```bash
npm run deploy:ton
```

> **Rate limited?** Follow the instructions for [TON Center API Key](#get-ton-center-api-key) or use `https://ton-testnet.api.onfinality.io/public/jsonRPC` as `TON_RPC_URL` in your `.env`

After deployment, add the contract address to your `.env` file as `TON_RECEIVER_ADDRESS` and source the `.env` file:

```bash
source .env
```

**Verify on TON Explorer**

View your deployed contract at:
```
https://testnet.tonviewer.com/<TON_RECEIVER_ADDRESS>
```

### Send Message from EVM to TON

```bash
npm run evm2ton:send
```

#### Track on CCIP Explorer
   
Use the **source EVM transaction hash** to track delivery on CCIP Explorer:

```
https://ccip.chain.link/
```

> **NOTE**: It may take up to 15 minutes for the message to be finalized.

#### Check the message on TON

```bash
npm run utils:checkTON
```

### Send Message from TON to EVM

```bash
npm run ton2evm:send
```

#### Track on CCIP Explorer
   
Use the **destination EVM transaction hash** to track delivery on CCIP Explorer:

```
https://ccip.chain.link/
```

> **NOTE**: It may take up to 15 minutes for the message to be finalized.

#### Check the message on EVM

```bash
npm run utils:checkEVM
```
