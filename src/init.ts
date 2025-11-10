import { getConfig } from './config/config';
import {
  ApiService,
  DatabaseService,
  ChainDetectorService,
  LoggerService,
} from './services';

/**
 * Initialize database with all chains without sending notifications
 */
async function initDatabase() {
  const logger = new LoggerService('Init');

  console.log('🔄 Database Initialization');
  console.log('=========================\n');

  try {
    // Load configuration
    const config = getConfig();

    logger.info('Initializing database...');

    // Initialize services (without Telegram)
    const apiService = new ApiService(config.api.url);
    const databaseService = new DatabaseService(config.database.path);
    const chainDetectorService = new ChainDetectorService(databaseService);

    // Fetch all chains from API
    logger.info('Fetching chains from API...');
    const chains = await apiService.fetchChainsWithRetry();
    logger.info(`Fetched ${chains.length} chains from API`);

    // Process and save all chains
    logger.info('Processing and saving chains to database...');
    const newChains = chainDetectorService.processChains(chains);

    // Close database connection
    databaseService.close();

    logger.success(`✅ Database initialized successfully!`);
    logger.success(`   Total chains saved: ${chains.length}`);
    logger.success(`   New chains: ${newChains.length}`);
    logger.success(`   Database path: ${config.database.path}`);

    console.log('\n✅ Done! You can now run the bot with: npm run dev');
  } catch (error) {
    console.error('❌ Fatal error during initialization:', error);
    process.exit(1);
  }
}

// Run initialization
initDatabase();
