import * as dotenv from 'dotenv';
dotenv.config();

// Network Information
export const SEPOLIA = {
  RPC_URL: process.env.SEPOLIA_RPC_URL!,
  ROUTER: process.env.SEPOLIA_ROUTER!,
  CHAIN_SELECTOR: BigInt(process.env.SEPOLIA_CHAIN_SELECTOR!),
  ONRAMP: process.env.SEPOLIA_ONRAMP || '', // To be discovered
  EXPLORER: 'https://sepolia.etherscan.io',
};

// Arbitrum Sepolia
export const ARBITRUM_SEPOLIA = {
  RPC_URL: process.env.ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
  ROUTER: process.env.ARBITRUM_SEPOLIA_ROUTER || '', // To be discovered
  CHAIN_SELECTOR: BigInt('3478487238524512106'), 
  ONRAMP: '0x483139c08d6bdbaa15c6d78051bcf40971482f5f',
  EXPLORER: 'https://sepolia.arbiscan.io',
};

export const AVALANCHE_FUJI = {
  RPC_URL: process.env.AVALANCHE_FUJI_RPC_URL || 'https://',
  ROUTER: process.env.AVALANCHE_FUJI_ROUTER || '', // To be discovered
  CHAIN_SELECTOR: BigInt(0),
  ONRAMP: process.env.AVALANCHE_FUJI || '', // To be discovered
  EXPLORER: 'https://testnet.snowtrace.io',
};

const TON_RPC_URL = (() => {
  let url = process.env.TON_RPC_URL || 'https://testnet.toncenter.com/api/v2/jsonRPC';
  const apiKey = process.env.TON_API_KEY;
  
  if (apiKey && !url.includes('api_key=')) {
    url += `${url.includes('?') ? '&' : '?'}api_key=${apiKey}`;
  }
  
  return url;
})();

export const TON_TESTNET = {
  RPC_URL: TON_RPC_URL,
  ROUTER: process.env.TON_ROUTER!,
  OFFRAMP: process.env.TON_OFFRAMP!,
  CHAIN_SELECTOR: BigInt(process.env.TON_CHAIN_SELECTOR!),
  EXPLORER: 'https://testnet.tonviewer.com',
};

// Wallet credentials
export const WALLET = {
  SEPOLIA_PRIVATE_KEY: process.env.SEPOLIA_PRIVATE_KEY!,
  TON_MNEMONIC: process.env.TON_MNEMONIC!,
};

// Deployed contracts (will be filled after deployment)
export const CONTRACTS = {
  TON_RECEIVER: process.env.TON_RECEIVER_ADDRESS || '',
  EVM_RECEIVER: process.env.EVM_RECEIVER_ADDRESS || '',
};

