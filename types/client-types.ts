import { Account } from "viem/accounts";
import { WalletClient, PublicClient, Client } from "viem";

/**
 * Type definitions for wallet and public clients used in benchmarking
 */

/**
 * Extended wallet client with EIP-712 support for zkSync transactions
 */
export type ExtendedWalletClient = any;

/**
 * Extended public client with L2-specific actions
 */
export type ExtendedPublicClient = any;

/**
 * Transaction clients bundle used for running benchmarks
 */
export interface TransactionClients {
  walletClient: ExtendedWalletClient;
  publicClient: ExtendedPublicClient;
}

/**
 * Transaction clients with account for running specific benchmark
 */
export interface TransactionClientsWithAccount extends TransactionClients {
  account: Account;
}

/**
 * Transaction parameters for sending to the blockchain
 */
export interface TransactionParams {
  to: `0x${string}`;
  value: bigint;
  paymaster?: `0x${string}`;
  paymasterInput?: `0x${string}`;
  nonce?: number;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  gas?: bigint;
}

