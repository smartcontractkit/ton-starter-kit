import { TonClient } from '@ton/ton';
import { Address } from '@ton/core';
import { WALLET, TON_TESTNET } from '../../config/constants';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { WalletContractV4 } from '@ton/ton';

async function checkRecentTx() {
  const client = new TonClient({ endpoint: TON_TESTNET.RPC_URL });
  
  const mnemonic = WALLET.TON_MNEMONIC.split(' ');
  const keyPair = await mnemonicToPrivateKey(mnemonic);
  const wallet = WalletContractV4.create({ 
    workchain: 0, 
    publicKey: keyPair.publicKey 
  });
  
  console.log('🔍 Checking transactions for:', wallet.address.toString());
  console.log('');
  
  try {
    const transactions = await client.getTransactions(wallet.address, { limit: 5 });
    
    for (let i = 0; i < Math.min(3, transactions.length); i++) {
      const tx = transactions[i];
      console.log(`Transaction ${i + 1}:`);
      console.log('  Hash:', tx.hash().toString('hex').substring(0, 16) + '...');
      console.log('  Time:', new Date(tx.now * 1000).toISOString());
      
      if (tx.outMessagesCount > 0) {
        console.log('  Out messages:', tx.outMessagesCount);
      }
      
      if (tx.inMessage) {
        const inMsg = tx.inMessage;
        if (inMsg.info.type === 'internal') {
          console.log('  IN from:', inMsg.info.src.toString());
          if (inMsg.info.bounced) {
            console.log('  ❌ BOUNCED!');
            if (inMsg.body) {
              const slice = inMsg.body.beginParse();
              const opcode = slice.loadUint(32);
              console.log('  Bounce opcode:', '0x' + opcode.toString(16));
            }
          }
        }
      }
      
      console.log('');
    }
  } catch (e) {
    console.error('Error fetching transactions:', e);
  }
}

checkRecentTx().catch(console.error);
