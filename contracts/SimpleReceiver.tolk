// Minimal TON CCIP Message Receiver
// Based on chainlink-ton test receiver

import "../chainlink-ton/contracts/contracts/lib/receiver/messages"
import "../chainlink-ton/contracts/contracts/ccip/router/messages"

// Storage: just the authorized caller (router/offramp address)
struct Storage {
    authorizedCaller: address;
    lastMessageId: int256?;
}

fun Storage.load(): Storage {
    return Storage.fromCell(contract.getData());
}

fun Storage.store(self) {
    return contract.setData(self.toCell());
}

fun onInternalMessage(in: InMessage) {
    val msg = Receiver_InMessage.fromSlice(in.body);
    
    match (msg) {
        Receiver_CCIPReceive => {
            var st = Storage.load();
            
            // Verify sender is the authorized caller (OffRamp)
            assert(in.senderAddress == st.authorizedCaller, 403);
            
            // Send confirmation back to Router/OffRamp
            val confirm = createMessage({
                bounce: true,
                value: 0,
                dest: in.senderAddress,
                body: Router_CCIPReceiveConfirm {
                    execId: msg.execId,
                }
            });
            confirm.send(SEND_MODE_CARRY_ALL_REMAINING_MESSAGE_VALUE);
            
            // Store the message ID
            st.lastMessageId = msg.message.messageId;
            st.store();
        }
    }
}

// Getter to check last received message
get fun getLastMessageId(): int256? {
    var st = Storage.load();
    return st.lastMessageId;
}
