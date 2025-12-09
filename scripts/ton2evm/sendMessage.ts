import { Address, toNano, Cell, beginCell, internal as createInternal } from '@ton/core'
import { TonClient, WalletContractV4 } from '@ton/ton'
import { mnemonicToPrivateKey } from '@ton/crypto'
import { SEPOLIA, TON_TESTNET, WALLET, CONTRACTS } from '../../config/constants'

async function sendTONToEVM() {
  console.log('🧪 Testing TON → EVM Messaging\n')

  const endpoint = TON_TESTNET.RPC_URL
  const client = new TonClient({ endpoint })

  const master = await client.getMasterchainInfo()
  console.log('✅ Connected to TON, Block:', master.latestSeqno)

  // Setup wallet
  const mnemonic = WALLET.TON_MNEMONIC.split(' ')
  const keyPair = await mnemonicToPrivateKey(mnemonic)
  const wallet = WalletContractV4.create({ 
    workchain: 0, 
    publicKey: keyPair.publicKey 
  })
  const walletContract = client.open(wallet)

  console.log('📤 Sending from:', wallet.address.toString())

  // Check balance
  const balance = await client.getBalance(wallet.address)
  console.log('💰 Balance:', Number(balance) / 1e9, 'TON\n')

  if (Number(balance) < 0.1e9) {
    console.error('❌ Insufficient balance. Need at least 0.1 TON')
    console.log('Get testnet TON from @testgiver_ton_bot on Telegram')
    return
  }

  // Verify receiver address is set
  if (!CONTRACTS.EVM_RECEIVER) {
    console.error('❌ EVM_RECEIVER_ADDRESS not set in .env')
    console.log('Deploy the EVM receiver first and add address to .env')
    return
  }

  // Network Information - EXACTLY as per 1-pager
  const routerAddress = Address.parse(TON_TESTNET.ROUTER)
  const destChainSelector = SEPOLIA.CHAIN_SELECTOR
  const evmReceiverAddr = CONTRACTS.EVM_RECEIVER
  const feeToken = Address.parseRaw('0:0000000000000000000000000000000000000000000000000000000000000001')
  const extraArgs = beginCell()
    .storeUint(0x181dcf10, 32)   // GenericExtraArgsV2 tag
    .storeBit(true)               // gasLimit IS present
    .storeUint(1_000_000, 256)    // gasLimit value (EVM gas units)
    .storeBit(true)               // allowOutOfOrderExecution
    .endCell()
  
    const data = beginCell()
    .storeStringTail('Hello EVM from TON')
    .endCell()

  const addrBytes = Buffer.from(evmReceiverAddr.slice(2), 'hex')
  const padded = Buffer.concat([Buffer.alloc(12, 0), addrBytes])
  const ccipSend = beginCell()
    .storeUint(0x31768d95, 32)              // CCIPSend opcode
    .storeUint(0, 64)                        // queryID
    .storeUint(destChainSelector, 64)        // destChainSelector
    .storeUint(padded.length, 8)             // receiver length (inline)
    .storeBuffer(padded)                     // receiver bytes (inline)
    .storeRef(data)                          // data
    .storeRef(Cell.EMPTY)                    // tokenAmounts (empty)
    .storeAddress(feeToken)                  // feeToken (native TON)
    .storeRef(extraArgs)                     // extraArgs
    .endCell()
  
  const seqno = await walletContract.getSeqno()
  await walletContract.sendTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [
      createInternal({
        to: routerAddress,           // Router address from 1-pager
        value: toNano('0.5'),         // Sufficient for simple messages (per 1-pager)
        body: ccipSend,               // Direct CCIPSend message
      })
    ]
  })
  
  console.log('✅ Transaction sent!\n')
  console.log('🔍 Monitor your transaction:')
  console.log(`   ${TON_TESTNET.EXPLORER}/${wallet.address.toString()}\n`)
  console.log('🔍 Monitor delivery on Sepolia:')
  console.log(`   ${SEPOLIA.EXPLORER}/address/${evmReceiverAddr}\n`)
}

sendTONToEVM().catch((error) => {
  console.error('❌ Error:', error.message)
  process.exit(1)
})

