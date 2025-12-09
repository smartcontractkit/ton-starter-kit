import { TonClient } from '@ton/ton';
import { Address } from '@ton/core';
import { TON_TESTNET, CONTRACTS } from '../../config/constants';

async function getTxHash() {
  const client = new TonClient({ endpoint: TON_TESTNET.RPC_URL });
  const receiverAddr = Address.parse(CONTRACTS.TON_RECEIVER);

  console.log('🔍 Getting latest transaction hash from TON receiver...\n');
  console.log('Receiver:', receiverAddr.toString());
  console.log('');

  const transactions = await client.getTransactions(receiverAddr, { limit: 2 });

  if (transactions.length > 0) {
    const latest = transactions[0];
    const txHash = latest.hash().toString('hex');
    const time = new Date(latest.now * 1000);

    console.log('Latest Transaction:');
    console.log('  Hash:', txHash);
    console.log('  Time:', time.toISOString());
    console.log('  Link:', `https://testnet.tonviewer.com/transaction/${txHash}`);

    if (latest.inMessage?.info.type === 'internal') {
      const sender = latest.inMessage.info.src;
      console.log('  From:', sender.toString());

      if (sender.toString() === TON_TESTNET.OFFRAMP || sender.toString() === TON_TESTNET.ROUTER) {
        console.log('  ✅ This is from CCIP OffRamp/Router!');
      }
    }
  }
}

getTxHash().catch(console.error);
