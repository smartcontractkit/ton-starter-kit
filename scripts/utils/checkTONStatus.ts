import { TonClient, WalletContractV4 } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { WALLET, TON_TESTNET } from '../../config/constants';

async function checkStatus() {
  const client = new TonClient({ endpoint: TON_TESTNET.RPC_URL });
  
  const mnemonic = WALLET.TON_MNEMONIC.split(' ');
  const keyPair = await mnemonicToPrivateKey(mnemonic);
  const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
  
  console.log('📋 Checking recent TON transactions from:', wallet.address.toString(), '\n');
  
  const txs = await client.getTransactions(wallet.address, { limit: 3 });
  
  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i];
    console.log(`Transaction ${i + 1}:`);
    console.log('  Hash:', tx.hash().toString('hex'));
    
    if (tx.description.type === 'generic' && tx.description.computePhase?.type === 'vm') {
      const success = tx.description.computePhase.success;
      const exitCode = tx.description.computePhase.exitCode;
      console.log('  Compute Success:', success);
      console.log('  Exit Code:', exitCode);
      console.log('  Action Success:', tx.description.actionPhase?.success);
      
      if (!success || exitCode !== 0) {
        console.log('  ⚠️  TRANSACTION FAILED');
      }
    }
    
    // Check for bounces
    if (tx.inMessage && tx.inMessage.info.type === 'internal' && tx.inMessage.info.bounced) {
      console.log('  ❌ BOUNCED MESSAGE');
    }
    
    console.log('');
  }
}

checkStatus().catch(console.error);

