import { ethers } from 'ethers'
import { Address } from '@ton/core'
import { SEPOLIA, TON_TESTNET, WALLET, CONTRACTS } from '../../config/constants'

async function sendEVMToTON() {
  console.log('🧪 Testing EVM → TON Messaging\n')

  // "TypeScript (Sepolia/EVM)" connection
  const endpoint = SEPOLIA.RPC_URL
  const provider = new ethers.JsonRpcProvider(endpoint)
  
  const blockNumber = await provider.getBlockNumber()
  console.log('✅ Connected to EVM, Block:', blockNumber)

  const wallet = new ethers.Wallet(WALLET.SEPOLIA_PRIVATE_KEY, provider)
  console.log('📤 Sending from:', wallet.address)

  // Check balance
  const balance = await provider.getBalance(wallet.address)
  console.log('💰 Balance:', ethers.formatEther(balance), 'ETH\n')

  if (balance < ethers.parseEther('0.01')) {
    console.error('❌ Insufficient balance. Need at least 0.01 ETH')
    console.log('Get testnet ETH from https://faucets.chain.link/sepolia')
    return
  }

  // Verify receiver address is set
  if (!CONTRACTS.TON_RECEIVER) {
    console.error('❌ TON_RECEIVER_ADDRESS not set in .env')
    console.log('Deploy the TON receiver first and add address to .env')
    return
  }

  // IRouterClient interface
  const routerABI = [
    "function ccipSend(uint64 destinationChainSelector, tuple(bytes receiver, bytes data, tuple(address token, uint256 amount)[] tokenAmounts, address feeToken, bytes extraArgs) message) external payable returns (bytes32)",
    "function getFee(uint64 destinationChainSelector, tuple(bytes receiver, bytes data, tuple(address token, uint256 amount)[] tokenAmounts, address feeToken, bytes extraArgs) message) external view returns (uint256)"
  ]

  // Router address from Network Information
  const router = new ethers.Contract(SEPOLIA.ROUTER, routerABI, wallet)

  // Chain selector from Network Information
  const destChainSelector = TON_TESTNET.CHAIN_SELECTOR
  const tonReceiverAddr = CONTRACTS.TON_RECEIVER

  console.log('📍 Router:', SEPOLIA.ROUTER)
  console.log('📍 TON Receiver:', tonReceiverAddr)
  console.log('📍 Destination: TON Testnet (', destChainSelector.toString(), ')\n')

  // Convert TON address to bytes
  console.log('🔧 Encoding TON receiver address...')
  const tonAddr = Address.parse(tonReceiverAddr)

  // FROM chainlink-ton/pkg/ccip/codec/addresscodec.go:
  // "4 byte workchain (int32) + 32 byte data" = 36 bytes total
  const workchain = tonAddr.workChain
  const accountId = tonAddr.hash
  
  // Encode as: workchain (int32, 4 bytes big-endian) + address hash (32 bytes)
  const workchainBytes = new Uint8Array(4);
  new DataView(workchainBytes.buffer).setInt32(0, workchain, false); // big-endian int32
  const receiverBytes = ethers.concat([
    workchainBytes,  // 4 bytes for workchain (int32)
    accountId  // 32 bytes for address hash
  ])
  console.log('✅ TON address encoded:', ethers.hexlify(receiverBytes).slice(0, 20) + '...')

  // Simple text message data
  console.log('🔧 Building message data...')
  const messageData = ethers.toUtf8Bytes('Hello TON from EVM')
  console.log('✅ Message data built')

  // "EVM > TON Schema" - GenericExtraArgsV2
  // Must be TRUE for TON destinations
  console.log('🔧 Building extraArgs...')
  const abiCoder = ethers.AbiCoder.defaultAbiCoder()
  const extraArgs = abiCoder.encode(
    ['uint256', 'bool'],
    [100_000_000, true] // gasLimit in nanoTON (0.1 TON = 100,000,000 nanoTON), allowOutOfOrderExecution
  )
  const extraArgsWithTag = ethers.concat(['0x181dcf10', extraArgs]) // GENERIC_EXTRA_ARGS_V2_TAG
  console.log('✅ ExtraArgs built\n')

  const message = {
    receiver: receiverBytes,
    data: messageData,
    tokenAmounts: [], // ✅ FROM 1-PAGER: "empty for messaging-only"
    feeToken: ethers.ZeroAddress, // ✅ FROM 1-PAGER: "0x0 = native token"
    extraArgs: extraArgsWithTag
  }

  // "EVM Fee Estimation"
  console.log('💰 Getting fee quote...')
  const fee = await router.getFee(destChainSelector, message)
  console.log('   Fee:', ethers.formatEther(fee), 'ETH')

  // "Add 10-20% buffer for safety"
  const feeWithBuffer = (fee * 110n) / 100n
  console.log('   Fee with buffer:', ethers.formatEther(feeWithBuffer), 'ETH\n')

  // Send message
  console.log('📤 Sending transaction...')
  const tx = await router.ccipSend(destChainSelector, message, { 
    value: feeWithBuffer 
  })

  console.log('✅ Transaction submitted!')
  console.log('   Hash:', tx.hash)
  console.log('\n⏳ Waiting for confirmation...')
  
  const receipt = await tx.wait()
  console.log('✅ Transaction confirmed in block:', receipt.blockNumber)
  
  // Extract message ID from logs
  const messageId = receipt.logs[0]?.topics[1]
  console.log('📋 Message ID:', messageId)

  console.log('\n⏳ Message is being processed by CCIP network...')
  console.log('⏳ Expected delivery: 5-15 minutes (staging environment)\n')
  console.log('🔍 Monitor your transaction:')
  console.log(`   ${SEPOLIA.EXPLORER}/tx/${tx.hash}\n`)
  console.log('🔍 Monitor delivery on TON:')
  console.log(`   ${TON_TESTNET.EXPLORER}/${tonReceiverAddr}\n`)
  console.log('💡 Run verification script after 10-15 minutes:')
  console.log('   npm run utils:checkTON')
}

sendEVMToTON().catch((error) => {
  console.error('❌ Error:', error.message)
  process.exit(1)
})

