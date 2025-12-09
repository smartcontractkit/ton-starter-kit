// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {CCIPReceiver} from "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";

contract MessageReceiver is CCIPReceiver {
    event MessageFromTON(
        bytes32 indexed messageId,
        uint64 indexed sourceChainSelector,
        bytes sender,
        bytes data
    );

    bytes public lastReceivedData;
    bytes32 public lastMessageId;

    constructor(address router) CCIPReceiver(router) {}

    function _ccipReceive(Client.Any2EVMMessage memory message) 
        internal 
        override 
    {
        lastMessageId = message.messageId;
        lastReceivedData = message.data;
        
        emit MessageFromTON(
            message.messageId,
            message.sourceChainSelector,
            message.sender,
            message.data
        );
    }

    function getLastMessage() external view returns (bytes32, bytes memory) {
        return (lastMessageId, lastReceivedData);
    }
}

