/**
 * Application-wide configuration constants
 */

export const APP_CONFIG = {
  /**
   * URL for the block explorer to view transactions
   */
  BLOCK_EXPLORER_URL: "https://sepolia.abscan.org",
  
  /**
   * Interval for updating elapsed time during benchmark (ms)
   */
  TIMER_UPDATE_INTERVAL: 50,
  
  /**
   * Duration for animated counter transitions (ms)
   */
  COUNTER_ANIMATION_DURATION: 100,
} as const;

export const APP_METADATA = {
  title: "Transaction Simulator",
  description: "Explore the RPC calls that occur when sending a transaction on Abstract",
  appName: "Transaction Simulator",
} as const;

