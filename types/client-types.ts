import { Account } from "viem/accounts";
import { createBenchmarkClients } from "@/lib/benchmark-clients";

type BenchmarkClients = ReturnType<typeof createBenchmarkClients>;

export type ExtendedWalletClient = BenchmarkClients["walletClient"];

export type ExtendedPublicClient = BenchmarkClients["publicClient"];

export interface TransactionClients {
  walletClient: ExtendedWalletClient;
  publicClient: ExtendedPublicClient;
}

export interface TransactionClientsWithAccount extends TransactionClients {
  account: Account;
}


