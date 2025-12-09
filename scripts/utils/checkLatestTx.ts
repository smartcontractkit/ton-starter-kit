import { TonClient } from '@ton/ton';
import { Address } from '@ton/core';
import { WALLET, TON_TESTNET } from '../../config/constants';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { WalletContractV4 } from '@ton/ton';

async function checkLatestTx() {
  const client = new TonClient({ endpoint: TON_TESTNET.RPC_URL });
  
  const mnemonic = WALLET.TON_MNEMONIC.split(' ');
  const keyPair = await mnemonicToPrivateKey(mnemonic);
  const wallet = WalletContractV4.create({ 
    workchain: 0, 
    publicKey: keyPair.publicKey 
  });
  
  console.log('🔍 Checking latest transaction...\n');
  
  const transactions = await client.getTransactions(wallet.address, { limit: 3 });
  
  if (transactions.length === 0) {
    console.log('No transactions found');
    return;
  }
  
  const latest = transactions[0];
  
  console.log('📋 Latest Transaction:');
  console.log('════════════════════════════════════════════════════════════\n');
  console.log('Hash:', latest.hash().toString('hex').substring(0, 32) + '...');
  console.log('Time:', new Date(latest.now * 1000).toLocaleString());
  console.log('');
  
  // Check if we have a bounce
  let hasBounce = false;
  if (latest.inMessage) {
    const inMsg = latest.inMessage;
    if (inMsg.info.type === 'internal' && inMsg.info.bounced) {
      hasBounce = true;
      console.log('❌ STATUS: BOUNCED');
      console.log('   Message was rejected and funds returned\n');
      
      if (inMsg.body) {
        const slice = inMsg.body.beginParse();
        const opcode = slice.loadUint(32);
        console.log('   Bounce opcode:', '0x' + opcode.toString(16));
      }
    }
  }
  
  if (!hasBounce && latest.outMessagesCount > 0) {
    console.log('✅ STATUS: ACCEPTED');
    console.log('   Message sent successfully, no bounce received!\n');
    console.log('   Out messages:', latest.outMessagesCount);
    console.log('');
    console.log('⏳ Now waiting for CCIP network to deliver to EVM...');
    console.log('   Expected: 2-5 minutes');
    console.log('');
    console.log('🔍 View on explorer:');
    console.log('   https://testnet.tonviewer.com/transaction/' + latest.hash().toString('hex'));
  }
  
  console.log('\n════════════════════════════════════════════════════════════');
}

checkLatestTx().catch(console.error);
