import { ethers } from "ethers";
import hre from "hardhat";
import * as dotenv from "dotenv";
import { SEPOLIA } from '../../config/constants';
import MessageReceiverArtifact from '../../artifacts/contracts/MessageReceiver.sol/MessageReceiver.json' assert { type: 'json' };

dotenv.config();

async function main() {
  console.log("🚀 Deploying MessageReceiver contract to Sepolia...\n");

  // Router address from staging environment, comes from constants.ts
  const SEPOLIA_ROUTER = SEPOLIA.ROUTER;

  // Create provider and wallet
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com');
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);
  
  console.log("📤 Deploying from account:", wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy contract
  console.log("⏳ Deploying MessageReceiver with router:", SEPOLIA_ROUTER);
  const factory = new ethers.ContractFactory(
    MessageReceiverArtifact.abi,
    MessageReceiverArtifact.bytecode,
    wallet
  );
  const receiver = await factory.deploy(SEPOLIA_ROUTER);

  await receiver.waitForDeployment();
  const receiverAddress = await receiver.getAddress();

  console.log("\n✅ MessageReceiver deployed successfully!");
  console.log("📍 Contract address:", receiverAddress);
  console.log("📍 Router address:", SEPOLIA_ROUTER);
  
  console.log("\n📝 Next steps:");
  console.log("1. Add this address to your .env file as EVM_RECEIVER_ADDRESS");
  console.log("2. Wait 1-2 minutes for Etherscan to index the contract");
  console.log("3. Verify the contract (optional):");
  console.log(`   npx hardhat verify --network sepolia ${receiverAddress} ${SEPOLIA_ROUTER}`);
  console.log("\n🔍 View on Etherscan:");
  console.log(`   https://sepolia.etherscan.io/address/${receiverAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

