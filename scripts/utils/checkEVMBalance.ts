import { ethers } from 'ethers';
import { SEPOLIA, WALLET } from '../../config/constants';

async function checkBalance() {
  const provider = new ethers.JsonRpcProvider(SEPOLIA.RPC_URL);
  const wallet = new ethers.Wallet(WALLET.SEPOLIA_PRIVATE_KEY, provider);
  
  console.log('📍 Wallet address:', wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Balance:', ethers.formatEther(balance), 'ETH');
  
  if (balance === 0n) {
    console.log('\n❌ No balance! Get testnet ETH from:');
    console.log('   https://www.alchemy.com/faucets/ethereum-sepolia');
  } else {
    console.log('\n✅ Wallet has balance, ready to send!');
  }
}

checkBalance().catch(console.error);
