import { Chain, NewChainDetection } from '../types';
import { DatabaseService } from './database.service';

/**
 * Chain detector service for identifying new chains
 */
export class ChainDetectorService {
  constructor(private databaseService: DatabaseService) {}

  /**
   * Detect new chains by comparing API data with database
   */
  detectNewChains(apiChains: Chain[]): NewChainDetection[] {
    const existingChainIds = this.databaseService.getAllChainIds();
    const newChains: NewChainDetection[] = [];

    for (const chain of apiChains) {
      if (!existingChainIds.has(chain.chain)) {
        newChains.push({
          chain,
          detectedAt: new Date(),
        });
      }
    }

    return newChains;
  }

  /**
   * Process and save new chains to the database
   */
  processNewChains(newChains: NewChainDetection[]): void {
    for (const detection of newChains) {
      try {
        this.databaseService.saveChain(detection.chain);
        console.log(
          `[${detection.detectedAt.toISOString()}] New chain saved: ${detection.chain.name} (ID: ${detection.chain.chain})`
        );
      } catch (error) {
        console.error(
          `Failed to save chain ${detection.chain.name} (ID: ${detection.chain.chain}):`,
          error
        );
      }
    }
  }

  /**
   * Update existing chains with new data
   */
  updateExistingChains(apiChains: Chain[]): void {
    const existingChainIds = this.databaseService.getAllChainIds();

    for (const chain of apiChains) {
      if (existingChainIds.has(chain.chain)) {
        try {
          this.databaseService.updateChain(chain);
        } catch (error) {
          console.error(
            `Failed to update chain ${chain.name} (ID: ${chain.chain}):`,
            error
          );
        }
      }
    }
  }

  /**
   * Process all chains: detect new ones and update existing ones
   */
  processChains(apiChains: Chain[]): NewChainDetection[] {
    // Detect new chains
    const newChains = this.detectNewChains(apiChains);

    // Save new chains
    if (newChains.length > 0) {
      this.processNewChains(newChains);
      console.log(`✅ Detected and saved ${newChains.length} new chain(s)`);
    }

    // Update existing chains
    this.updateExistingChains(apiChains);

    return newChains;
  }
}
