import { ethers } from 'ethers';
import { SEPOLIA, CONTRACTS } from '../../config/constants';

async function checkEVMDelivery() {
  console.log('🔍 Checking EVM Receiver on Sepolia...\n');
  
  const provider = new ethers.JsonRpcProvider(SEPOLIA.RPC_URL);
  const receiverAddr = CONTRACTS.EVM_RECEIVER;
  
  console.log('Receiver:', receiverAddr);
  console.log('');
  
  // Simple receiver ABI
  const abi = [
    'function lastSender() view returns (bytes)',
    'function lastMessage() view returns (bytes)',
    'function lastMessageId() view returns (bytes32)'
  ];
  
  const receiver = new ethers.Contract(receiverAddr, abi, provider);
  
  try {
    const lastSender = await receiver.lastSender();
    const lastMessage = await receiver.lastMessage();
    const lastMessageId = await receiver.lastMessageId();
    
    console.log('════════════════════════════════════════════════════════════');
    console.log('Last Sender:', lastSender || '(empty)');
    console.log('Last Message:', lastMessage || '(empty)');
    
    if (lastMessage && lastMessage !== '0x') {
      try {
        const decoded = ethers.toUtf8String(lastMessage);
        console.log('Decoded:', decoded);
      } catch (e) {
        console.log('Hex:', lastMessage);
      }
    }
    
    console.log('Last Message ID:', lastMessageId);
    console.log('════════════════════════════════════════════════════════════');
    
    if (lastMessage && lastMessage !== '0x' && lastMessage.length > 2) {
      console.log('\n✅ Message RECEIVED on EVM!');
      console.log('🎉 TON → EVM messaging is WORKING!\n');
    } else {
      console.log('\n⏳ No message yet (or empty)');
      console.log('   Wait a few more minutes and check again\n');
    }
    
    console.log('🔍 View on Etherscan:');
    console.log(`   ${SEPOLIA.EXPLORER}/address/${receiverAddr}#events`);
    
  } catch (e: any) {
    console.error('Error reading contract:', e.message);
  }
}

checkEVMDelivery().catch(console.error);
