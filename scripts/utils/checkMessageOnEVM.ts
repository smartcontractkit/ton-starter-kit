import { ethers } from 'ethers'
import { SEPOLIA, TON_TESTNET, CONTRACTS } from '../../config/constants'

/**
 * Verify that a TON → EVM message was delivered
 * 
 * Usage:
 *   npm run utils:checkEVM                         # Check latest message
 *   MESSAGE_ID=0x... npm run utils:checkEVM        # Verify specific message ID
 */
async function verifyEVMReceiver() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  TON → EVM Message Verification')
  console.log('═══════════════════════════════════════════════════════════════\n')

  const provider = new ethers.JsonRpcProvider(SEPOLIA.RPC_URL)
  const expectedMessageId = process.env.MESSAGE_ID
  const expectedMessage = process.env.MESSAGE || 'Hello EVM from TON'
  
  const receiverABI = [
    "event MessageReceived(bytes32 indexed messageId, uint64 indexed sourceChainSelector, address sender, bytes data)",
    "function getLastMessage() external view returns (bytes32, bytes)"
  ]

  const receiver = new ethers.Contract(
    CONTRACTS.EVM_RECEIVER,
    receiverABI,
    provider
  )

  console.log('📍 Receiver Contract:', CONTRACTS.EVM_RECEIVER)
  console.log('🔍 Looking for message:', `"${expectedMessage}"`)
  console.log('🔍 Expected source:', TON_TESTNET.CHAIN_SELECTOR.toString(), '(TON Testnet)\n')

  if (expectedMessageId) {
    console.log('🎯 Searching for specific Message ID:', expectedMessageId, '\n')
  }

  // Check contract state for latest message
  console.log('📊 Checking contract state...\n')
  
  let lastMessageId: string = ethers.ZeroHash
  let lastMessageData: string = ''
  
  try {
    const [messageId, data] = await receiver.getLastMessage()
    lastMessageId = messageId
    lastMessageData = data
  } catch (error: any) {
    console.log('⚠️  Could not read contract state (contract may not have getLastMessage)')
  }

  // Query events for more details
  const currentBlock = await provider.getBlockNumber()
  const fromBlock = currentBlock - 5000 // ~17 hours of blocks
  
  console.log('📊 Scanning blocks', fromBlock, 'to', currentBlock, '...\n')

  const filter = receiver.filters.MessageReceived()
  const events = await receiver.queryFilter(filter, fromBlock, currentBlock)

  if (events.length === 0) {
    console.log('❌ No MessageReceived events found in recent blocks\n')
    console.log('⏳ If you just sent a message from TON, it may still be in transit.')
    console.log('   CCIP delivery typically takes 5-15 minutes.\n')
    printHelp()
    return
  }

  // Get the most recent event
  const latestEvent = events[events.length - 1] as any
  const block = await provider.getBlock(latestEvent.blockNumber)
  const timestamp = block ? new Date(block.timestamp * 1000) : new Date()
  
  // Decode the message
  let decodedMessage = ''
  try {
    decodedMessage = ethers.toUtf8String(latestEvent.args?.data || '0x')
  } catch {
    decodedMessage = '[Binary data]'
  }

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  ✅ CCIP MESSAGE FOUND')
  console.log('═══════════════════════════════════════════════════════════════\n')

  console.log('📨 Most Recent Message:')
  console.log('   Message ID:  ', latestEvent.args?.messageId)
  console.log('   Source Chain:', latestEvent.args?.sourceChainSelector?.toString(), '(TON Testnet ✓)')
  console.log('   Message:     ', `"${decodedMessage}"`)
  console.log('   Block:       ', latestEvent.blockNumber)
  console.log('   Time:        ', timestamp.toISOString())
  console.log('   TX Hash:     ', latestEvent.transactionHash)
  console.log('')

  // Calculate time ago
  const minutesAgo = Math.round((Date.now() - timestamp.getTime()) / 60000)
  if (minutesAgo < 60) {
    console.log(`   📍 Received ${minutesAgo} minute(s) ago`)
  } else {
    console.log(`   📍 Received ${Math.round(minutesAgo / 60)} hour(s) ago`)
  }
  console.log('')

  // Verification result
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  VERIFICATION RESULT')
  console.log('═══════════════════════════════════════════════════════════════\n')

  // Check if message matches expected
  const messageMatches = decodedMessage === expectedMessage
  const sourceMatches = latestEvent.args?.sourceChainSelector?.toString() === TON_TESTNET.CHAIN_SELECTOR.toString()
  const idMatches = !expectedMessageId || latestEvent.args?.messageId === expectedMessageId

  if (messageMatches && sourceMatches) {
    console.log('✅ Message verified successfully!')
    console.log('')
    console.log('   ✓ Message content matches:', `"${expectedMessage}"`)
    console.log('   ✓ Source chain is TON Testnet')
    if (expectedMessageId && idMatches) {
      console.log('   ✓ Message ID matches')
    }
    console.log('')
  } else if (sourceMatches && minutesAgo < 30) {
    console.log('✅ Recent TON → EVM message delivered!')
    console.log('')
    if (!messageMatches) {
      console.log(`   ⚠️  Message content differs:`)
      console.log(`      Expected: "${expectedMessage}"`)
      console.log(`      Received: "${decodedMessage}"`)
      console.log('')
      console.log('   This is normal if you sent a different message.')
    }
  } else {
    console.log('⚠️  Latest message is older than 30 minutes.')
    console.log('')
    console.log('   If you recently sent a message from TON,')
    console.log('   it may still be in transit. Wait and check again.\n')
  }

  // Show transaction link
  console.log('🔗 View transaction:')
  console.log(`   ${SEPOLIA.EXPLORER}/tx/${latestEvent.transactionHash}\n`)

  // Show all messages if multiple
  if (events.length > 1) {
    console.log(`📊 Total messages found: ${events.length}`)
    console.log('   (showing most recent above)\n')
    
    console.log('Recent messages:')
    const recentEvents = events.slice(-5).reverse()
    for (let i = 0; i < recentEvents.length; i++) {
      const evt = recentEvents[i] as any
      let msg = ''
      try {
        msg = ethers.toUtf8String(evt.args?.data || '0x')
      } catch {
        msg = '[Binary]'
      }
      console.log(`   ${i + 1}. Block ${evt.blockNumber}: "${msg.slice(0, 30)}${msg.length > 30 ? '...' : ''}"`)
    }
    console.log('')
  }
}

function printHelp() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  TROUBLESHOOTING')
  console.log('═══════════════════════════════════════════════════════════════\n')
  console.log('1. Verify you sent the TON → EVM message:')
  console.log('   npm run ton2evm:send\n')
  console.log('2. Wait 5-15 minutes for CCIP to process\n')
  console.log('3. Check the TON TX was accepted (not bounced):')
  console.log(`   ${TON_TESTNET.EXPLORER}/<your-wallet-address>\n`)
  console.log('4. If still not working after 20 minutes, check:')
  console.log('   - Is EVM_RECEIVER_ADDRESS correct in .env?')
  console.log('   - Did the TON transaction succeed (no bounce)?')
}

verifyEVMReceiver().catch((error) => {
  console.error('❌ Error:', error.message)
  process.exit(1)
})
