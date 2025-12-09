import { TonClient, Address } from '@ton/ton'
import { TON_TESTNET, CONTRACTS } from '../../config/constants'

/**
 * Verify that an EVM → TON message was delivered
 * 
 * Usage:
 *   npm run utils:checkTON                    # Check latest message
 *   MESSAGE="Hello TON" npm run utils:checkTON  # Verify specific message content
 */
async function verifyTONReceiver() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  EVM → TON Message Verification')
  console.log('═══════════════════════════════════════════════════════════════\n')

  const client = new TonClient({ endpoint: TON_TESTNET.RPC_URL })
  const receiverAddr = Address.parse(CONTRACTS.TON_RECEIVER)
  const expectedMessage = process.env.MESSAGE || 'Hello TON from EVM'

  console.log('📍 Receiver Contract:', CONTRACTS.TON_RECEIVER)
  console.log('🔍 Looking for message:', `"${expectedMessage}"`)
  console.log('🔍 Expected sender:', TON_TESTNET.OFFRAMP, '(CCIP OffRamp)\n')

  // Get recent transactions
  console.log('📊 Fetching recent transactions...\n')
  
  const transactions = await client.getTransactions(receiverAddr, { limit: 20 })

  if (transactions.length === 0) {
    console.log('❌ No transactions found on receiver contract')
    console.log('⚠️  Receiver might not be deployed or no messages sent yet\n')
    printHelp()
    return
  }

  // Look for CCIP messages from OffRamp
  let ccipMessages: any[] = []
  
  for (const tx of transactions) {
    const inMsg = tx.inMessage
    if (inMsg && inMsg.info.type === 'internal') {
      const from = inMsg.info.src
      const value = inMsg.info.value.coins
      const time = new Date(tx.now * 1000)
      
      // Check if from OffRamp (CCIP message)
      if (from?.toString() === TON_TESTNET.OFFRAMP) {
        ccipMessages.push({
          from: from.toString(),
          value: Number(value) / 1e9,
          time,
          lt: tx.lt,
          hash: tx.hash().toString('hex')
        })
      }
    }
  }

  if (ccipMessages.length === 0) {
    console.log('❌ No CCIP messages found yet')
    console.log('')
    console.log('⏳ If you just sent a message, it may still be in transit.')
    console.log('   CCIP delivery typically takes 5-15 minutes.\n')
    printHelp()
    return
  }

  // Show the most recent CCIP message
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  ✅ CCIP MESSAGE FOUND')
  console.log('═══════════════════════════════════════════════════════════════\n')

  const latest = ccipMessages[0]
  console.log('📨 Most Recent CCIP Message:')
  console.log('   From:     ', latest.from, '(CCIP OffRamp ✓)')
  console.log('   Value:    ', latest.value, 'TON')
  console.log('   Time:     ', latest.time.toISOString())
  console.log('   TX Hash:  ', latest.hash.slice(0, 16) + '...')
  console.log('')

  // Calculate time ago
  const minutesAgo = Math.round((Date.now() - latest.time.getTime()) / 60000)
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

  if (minutesAgo < 30) {
    console.log('✅ Recent CCIP message delivered successfully!')
    console.log('')
    console.log('   If you sent a message in the last 30 minutes,')
    console.log('   this is likely your message.\n')
  } else {
    console.log('⚠️  Latest CCIP message is older than 30 minutes.')
    console.log('')
    console.log('   If you recently sent a message, it may still be in transit.')
    console.log('   Wait a few more minutes and check again.\n')
  }

  // Show all CCIP messages if multiple
  if (ccipMessages.length > 1) {
    console.log(`📊 Total CCIP messages found: ${ccipMessages.length}`)
    console.log('   (showing most recent above)\n')
  }

  console.log('🔗 View on explorer:')
  console.log(`   ${TON_TESTNET.EXPLORER}/${CONTRACTS.TON_RECEIVER}\n`)
  console.log(`   TX: ${TON_TESTNET.EXPLORER}/transaction/${latest.hash}`)
}

function printHelp() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  TROUBLESHOOTING')
  console.log('═══════════════════════════════════════════════════════════════\n')
  console.log('1. Verify you sent the EVM → TON message:')
  console.log('   npm run evm2ton:send\n')
  console.log('2. Wait 5-15 minutes for CCIP to process\n')
  console.log('3. Check the Sepolia TX was confirmed:')
  console.log(`   ${TON_TESTNET.EXPLORER}/${CONTRACTS.TON_RECEIVER}\n`)
  console.log('4. If still not working after 20 minutes, check:')
  console.log('   - Is TON_RECEIVER_ADDRESS correct in .env?')
  console.log('   - Did the EVM transaction succeed?')
}

verifyTONReceiver().catch((error) => {
  console.error('❌ Error:', error.message)
  process.exit(1)
})
