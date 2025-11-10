import { getConfig } from './config/config';
import { App } from './app';

/**
 * Main entry point
 */
async function main() {
  console.log('🚀 NewChain Detector Bot');
  console.log('========================\n');

  try {
    // Load configuration
    const config = getConfig();

    // Create and start application
    const app = new App(config);
    await app.start();

    // Handle graceful shutdown
    const shutdown = () => {
      console.log('\n\nReceived shutdown signal...');
      app.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      app.stop();
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Start the application
main();
