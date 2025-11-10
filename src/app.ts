import { AppConfig } from './types';
import {
  ApiService,
  DatabaseService,
  TelegramService,
  ChainDetectorService,
  LoggerService,
} from './services';

/**
 * Main application orchestrator
 */
export class App {
  private apiService: ApiService;
  private databaseService: DatabaseService;
  private telegramService: TelegramService;
  private chainDetectorService: ChainDetectorService;
  private logger: LoggerService;
  private config: AppConfig;
  private isRunning = false;
  private pollingInterval?: NodeJS.Timeout;

  constructor(config: AppConfig) {
    this.config = config;
    this.logger = new LoggerService('App');

    // Initialize services
    this.apiService = new ApiService(config.api.url);
    this.databaseService = new DatabaseService(config.database.path);
    this.telegramService = new TelegramService(
      config.telegram.botToken,
      config.telegram.chatId
    );
    this.chainDetectorService = new ChainDetectorService(this.databaseService);
  }

  /**
   * Start the application
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Application is already running');
      return;
    }

    this.logger.info('Starting NewChain Detector...');

    if (this.config.silentMode) {
      this.logger.info('Silent mode enabled - notifications will be skipped');
    }

    this.isRunning = true;

    try {
      // Try to send test message (optional, don't fail if it doesn't work) - skip in silent mode
      if (!this.config.silentMode) {
        try {
          await this.telegramService.sendTestMessage();
          this.logger.success('Telegram bot connected successfully');
        } catch (testError) {
          this.logger.warn('Failed to send test message, but continuing anyway');
          this.logger.debug('Test message error:', testError);
        }
      }

      // Run initial check
      await this.checkForNewChains();

      // Start polling
      this.startPolling();

      const modeText = this.config.silentMode ? '(Silent Mode)' : '';
      this.logger.success(
        `Bot started! ${modeText} Checking for new chains every ${this.config.polling.intervalMs / 1000} seconds`
      );
    } catch (error) {
      this.logger.error('Failed to start application', error);
      // Try to notify error, but don't fail if it doesn't work
      try {
        await this.telegramService.notifyError(error as Error);
      } catch (notifyError) {
        this.logger.debug('Failed to send error notification:', notifyError);
      }
      throw error;
    }
  }

  /**
   * Stop the application
   */
  stop(): void {
    if (!this.isRunning) {
      this.logger.warn('Application is not running');
      return;
    }

    this.logger.info('Stopping NewChain Detector...');

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }

    this.databaseService.close();
    this.isRunning = false;

    this.logger.success('Application stopped successfully');
  }

  /**
   * Start polling for new chains
   */
  private startPolling(): void {
    this.pollingInterval = setInterval(async () => {
      await this.checkForNewChains();
    }, this.config.polling.intervalMs);
  }

  /**
   * Check for new chains
   */
  private async checkForNewChains(): Promise<void> {
    try {
      this.logger.info('Checking for new chains...');

      // Fetch chains from API
      const chains = await this.apiService.fetchChainsWithRetry();
      this.logger.info(`Fetched ${chains.length} chains from API`);

      // Process chains and detect new ones
      const newChains = this.chainDetectorService.processChains(chains);

      // Send notifications for new chains (skip in silent mode)
      if (newChains.length > 0) {
        this.logger.success(`Found ${newChains.length} new chain(s)!`);

        if (!this.config.silentMode) {
          const chainsToNotify = newChains.map((detection) => detection.chain);
          await this.telegramService.notifyNewChains(chainsToNotify);
          this.logger.success('Notifications sent successfully');
        } else {
          this.logger.info('Silent mode - skipping notifications');
        }
      } else {
        this.logger.info('No new chains detected');
      }
    } catch (error) {
      this.logger.error('Error during chain check', error);

      // Skip error notifications in silent mode
      if (!this.config.silentMode) {
        await this.telegramService.notifyError(error as Error);
      }
    }
  }
}
