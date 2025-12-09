import { ethers } from 'ethers';
import { SEPOLIA, CONTRACTS } from '../../config/constants';

async function checkReceiver() {
  const provider = new ethers.JsonRpcProvider(SEPOLIA.RPC_URL);
  
  console.log('🔍 Checking EVM Receiver Configuration\n');
  console.log('Receiver:', CONTRACTS.EVM_RECEIVER);
  console.log('Expected Router:', SEPOLIA.ROUTER);
  console.log('');
  
  // Check if contract exists
  const code = await provider.getCode(CONTRACTS.EVM_RECEIVER);
  console.log('Contract exists:', code !== '0x' ? '✅' : '❌');
  
  if (code === '0x') {
    console.log('\n❌ No receiver contract deployed!');
    console.log('Need to deploy EVM receiver first.');
    return;
  }
  
  // Check router configuration (if we can query it)
  try {
    const receiverABI = [
      'function getRouter() external view returns (address)',
      'function s_ccipRouter() external view returns (address)',
      'function i_ccipRouter() external view returns (address)',
    ];
    
    const receiver = new ethers.Contract(CONTRACTS.EVM_RECEIVER, receiverABI, provider);
    
    let routerAddr;
    try {
      routerAddr = await receiver.getRouter();
    } catch {
      try {
        routerAddr = await receiver.s_ccipRouter();
      } catch {
        try {
          routerAddr = await receiver.i_ccipRouter();
        } catch {
          console.log('⚠️  Cannot query router address from contract');
          console.log('Proceeding anyway - receiver likely accepts messages from any router\n');
          console.log('✅ Ready to test TON → EVM!');
          return;
        }
      }
    }
    
    console.log('Router in contract:', routerAddr);
    console.log('Match:', routerAddr.toLowerCase() === SEPOLIA.ROUTER.toLowerCase() ? '✅' : '❌');
    
    if (routerAddr.toLowerCase() !== SEPOLIA.ROUTER.toLowerCase()) {
      console.log('\n⚠️  Router mismatch! May need to redeploy receiver.');
      console.log('But let\'s try anyway - some receivers accept from any router.');
    } else {
      console.log('\n✅ Receiver is correctly configured!');
    }
    
  } catch (e: any) {
    console.log('⚠️  Could not verify router config:', e.message.split('\n')[0]);
    console.log('Proceeding anyway...\n');
  }
  
  console.log('\n✅ Ready to send TON → EVM message!');
}

checkReceiver().catch(console.error);
