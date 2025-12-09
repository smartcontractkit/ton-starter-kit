import { TonClient } from '@ton/ton';
import { Address } from '@ton/core';
import { WALLET, TON_TESTNET } from '../../config/constants';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { WalletContractV4 } from '@ton/ton';

async function getFullHash() {
  const client = new TonClient({ endpoint: TON_TESTNET.RPC_URL });
  const mnemonic = WALLET.TON_MNEMONIC.split(' ');
  const keyPair = await mnemonicToPrivateKey(mnemonic);
  const wallet = WalletContractV4.create({ 
    workchain: 0, 
    publicKey: keyPair.publicKey 
  });
  
  const transactions = await client.getTransactions(wallet.address, { limit: 1 });
  
  if (transactions.length > 0) {
    const latest = transactions[0];
    const fullHash = latest.hash().toString('hex');
    console.log('Full TX Hash:', fullHash);
    console.log('Link: https://testnet.tonviewer.com/transaction/' + fullHash);
  }
}

getFullHash().catch(console.error);
