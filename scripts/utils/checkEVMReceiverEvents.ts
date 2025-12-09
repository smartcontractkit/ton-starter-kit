import { ethers } from 'ethers';
import { SEPOLIA, CONTRACTS } from '../../config/constants';

async function checkEvents() {
  const provider = new ethers.JsonRpcProvider(SEPOLIA.RPC_URL);
  const receiverAddr = CONTRACTS.EVM_RECEIVER;
  
  console.log('🔍 Checking for recent events on EVM Receiver...\n');
  console.log('Receiver:', receiverAddr);
  console.log('');
  
  try {
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = currentBlock - 100; // Check last ~100 blocks (~20 mins)
    
    console.log('Checking blocks:', fromBlock, 'to', currentBlock, '\n');
    
    // Get all logs (events) for this address
    const logs = await provider.getLogs({
      address: receiverAddr,
      fromBlock: fromBlock,
      toBlock: 'latest'
    });
    
    if (logs.length === 0) {
      console.log('❌ No events found in the last ~100 blocks');
      console.log('   Message might still be in transit, or receiver not reached yet.\n');
    } else {
      console.log(`✅ Found ${logs.length} event(s):\n`);
      
      for (const log of logs) {
        console.log('Event:');
        console.log('  Block:', log.blockNumber);
        console.log('  Tx:', log.transactionHash);
        console.log('  Topics:', log.topics);
        console.log('');
      }
    }
    
    console.log('🔍 View receiver on Etherscan:');
    console.log(`   ${SEPOLIA.EXPLORER}/address/${receiverAddr}#events`);
    
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

checkEvents().catch(console.error);
