// SPDX-License-Identifier: MIT
// MessageReceiver.tolk - TON CCIP Message Receiver Example

import "@stdlib/tolk-stdlib"
import "@chainlink-ton/contracts/ccip/types"

// Storage structure for the receiver
struct Storage {
    offRamp: address,           // Address of the OffRamp contract
    lastSender: address?,       // Last message sender (optional)
    lastMessage: slice?,        // Last received message data (optional)
    lastMessageId: int256?      // Last CCIP message ID (optional)
}

// Event emitted when a message is received
struct ReceivedMessage {
    messageId: int256,
    sourceChainSelector: uint64,
    sender: slice,
    message: slice
}

// Initialize the contract
fun init(offRamp: address) {
    var storage: Storage = Storage {
        offRamp: offRamp,
        lastSender: null,
        lastMessage: null,
        lastMessageId: null
    };
    storage.save();
}

// Handle incoming internal messages
fun onInternalMessage(msg: InMessage) {
    var storage = Storage.load();
    
    // Parse the message body
    var body = msg.body;
    var op = body.loadUint(32);
    
    // Check if this is a CCIPReceive message (opcode 0xb3126df1)
    if (op == 0xb3126df1) {
        // Verify the message comes from the authorized OffRamp
        assert(msg.senderAddress == storage.offRamp, 403);  // Error.Unauthorized
        
        // Parse CCIPReceive structure
        var execId = body.loadUint(192);  // ✅ Changed from rootId:uint224 to execId:uint192
        
        // Parse Any2TVMMessage (inline)
        var messageId = body.loadInt(256);
        var sourceChainSelector = body.loadUint(64);
        var sender = body.loadSlice(body.loadUint(8));  // sender length + address
        var data = body.loadRef();  // data cell
        
        // Extract message text from data cell
        var dataSlice = data.beginParse();
        var message = dataSlice.loadSlice(dataSlice.bitsLeft());
        
        // Store the received message
        storage.lastSender = sender;
        storage.lastMessage = message;
        storage.lastMessageId = messageId;
        storage.save();
        
        // Send confirmation back to OffRamp (REQUIRED)
        var confirmMsg = createMessage({
            bounce: true,
            value: ton("0.05"),
            dest: msg.senderAddress,
            body: beginCell()
                .storeUint(0x1e55bbf6, 32)  // ✅ Router_CCIPReceiveConfirm opcode (NEW: CRC32 hash)
                .storeUint(execId, 192)      // ✅ execId from CCIPReceive (changed from 224 to 192 bits)
                .endCell()
        });
        confirmMsg.send(SEND_MODE_REGULAR);
        
        // Emit event (for tracking)
        emitLog(ReceivedMessage {
            messageId: messageId,
            sourceChainSelector: sourceChainSelector,
            sender: sender,
            message: message
        });
    }
}

// View function to get the last received message
get fun getLastMessage(): (int256?, slice?) {
    var storage = Storage.load();
    return (storage.lastMessageId, storage.lastMessage);
}

// View function to get the last sender
get fun getLastSender(): address? {
    var storage = Storage.load();
    return storage.lastSender;
}

