/**
 * Represents a blockchain chain from the API
 */
export interface Chain {
  bal: string;
  chain: number;
  decimals: number;
  explorer: string;
  gas: string;
  gwei: string;
  inbound: boolean;
  mainnet: boolean;
  maxInbound: number;
  maxInboundNative: string;
  maxOutbound: number;
  maxOutboundNative: string;
  minOutbound: number;
  minOutboundNative: string;
  name: string;
  price: number;
  rpcs: string[];
  short: number;
  symbol: string;
}

/**
 * API response structure
 */
export interface ChainsApiResponse {
  chains: Chain[];
}

/**
 * Database chain record with metadata
 */
export interface ChainRecord extends Chain {
  id?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * New chain detection result
 */
export interface NewChainDetection {
  chain: Chain;
  detectedAt: Date;
}
