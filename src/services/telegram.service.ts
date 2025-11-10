import TelegramBot from 'node-telegram-bot-api';
import { Chain } from '../types';

/**
 * Bot statistics callback type
 */
export type BotStatsCallback = () => {
  uptime: number;
  lastScanTime: Date | null;
  nextScanIn: number;
  pollingInterval: number;
  totalChains: number;
};

/**
 * Telegram service for sending notifications
 */
export class TelegramService {
  private bot: TelegramBot;
  private chatId: string;
  private statsCallback?: BotStatsCallback;

  constructor(botToken: string, chatId: string) {
    this.bot = new TelegramBot(botToken, { polling: true });
    this.chatId = chatId;
    this.setupCommands();
  }

  /**
   * Set the callback to get bot statistics
   */
  setStatsCallback(callback: BotStatsCallback): void {
    this.statsCallback = callback;
  }

  /**
   * Setup bot commands
   */
  private setupCommands(): void {
    // Handle /ping command
    this.bot.onText(/\/ping/, async (msg) => {
      if (this.statsCallback) {
        await this.handlePingCommand(msg);
      }
    });

    // Handle /start command
    this.bot.onText(/\/start/, async (msg) => {
      await this.handleStartCommand(msg);
    });
  }

  /**
   * Handle /ping command
   */
  private async handlePingCommand(msg: TelegramBot.Message): Promise<void> {
    try {
      if (!this.statsCallback) {
        return;
      }

      const stats = this.statsCallback();
      const uptimeHours = Math.floor(stats.uptime / 3600);
      const uptimeMinutes = Math.floor((stats.uptime % 3600) / 60);
      const uptimeSeconds = Math.floor(stats.uptime % 60);

      const lastScanText = stats.lastScanTime
        ? `${this.formatTimeAgo(stats.lastScanTime)}`
        : 'Never';

      const nextScanText = `${Math.floor(stats.nextScanIn / 1000)}s`;

      const message = `
<b>🤖 Bot Status</b>

<b>Status:</b> ✅ Online
<b>Uptime:</b> ${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s

<b>📊 Monitoring Info</b>
<b>Scan interval:</b> ${stats.pollingInterval / 1000}s
<b>Last scan:</b> ${lastScanText}
<b>Next scan in:</b> ${nextScanText}

<b>💾 Database</b>
<b>Total chains:</b> ${stats.totalChains}

<b>⏰ Server time:</b> ${new Date().toISOString()}
      `.trim();

      await this.bot.sendMessage(msg.chat.id, message, {
        parse_mode: 'HTML',
      });
    } catch (error) {
      console.error('Error handling /ping command:', error);
    }
  }

  /**
   * Handle /start command
   */
  private async handleStartCommand(msg: TelegramBot.Message): Promise<void> {
    try {
      const message = `
<b>👋 Welcome to NewChain Detector!</b>

This bot monitors blockchain chains and notifies you when new chains are detected.

<b>Available commands:</b>
/ping - Check bot status and statistics
/start - Show this help message

The bot scans for new chains every 10 seconds and will automatically notify you when changes are detected.
      `.trim();

      await this.bot.sendMessage(msg.chat.id, message, {
        parse_mode: 'HTML',
      });
    } catch (error) {
      console.error('Error handling /start command:', error);
    }
  }

  /**
   * Format time ago
   */
  private formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) {
      return `${seconds}s ago`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ago`;
    } else if (seconds < 86400) {
      return `${Math.floor(seconds / 3600)}h ago`;
    } else {
      return `${Math.floor(seconds / 86400)}d ago`;
    }
  }

  /**
   * Stop the bot
   */
  stopPolling(): void {
    this.bot.stopPolling();
  }

  /**
   * Send notification about a new chain
   */
  async notifyNewChain(chain: Chain): Promise<void> {
    const message = this.formatChainMessage(chain);

    try {
      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });
    } catch (error) {
      throw new Error(`Failed to send Telegram notification: ${error}`);
    }
  }

  /**
   * Send notification about multiple new chains - sends one message per chain
   */
  async notifyNewChains(chains: Chain[]): Promise<void> {
    if (chains.length === 0) {
      return;
    }

    // Send a summary first if more than 1 chain
    if (chains.length > 1) {
      const summaryMessage = `<b>🚀 ${chains.length} New Chains Detected!</b>\n\nSending details...`;
      try {
        await this.bot.sendMessage(this.chatId, summaryMessage, {
          parse_mode: 'HTML',
        });
      } catch (error) {
        console.error('Failed to send summary message:', error);
      }
    }

    // Send one message per chain
    for (let i = 0; i < chains.length; i++) {
      try {
        await this.notifyNewChain(chains[i]);

        // Small delay between messages to avoid rate limiting
        if (i < chains.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Failed to send notification for chain ${chains[i].name}:`, error);
        // Continue with next chain even if one fails
      }
    }
  }

  /**
   * Format chain data into a readable message
   */
  private formatChainMessage(chain: Chain): string {
    const networkType = chain.mainnet ? '🟢 Mainnet' : '🟡 Testnet';
    const inboundStatus = chain.inbound ? '✅ Yes' : '❌ No';
    const explorerLink = chain.explorer ? chain.explorer : 'N/A';

    return `
<b>🔗 ${chain.name}</b>
${networkType}

<b>Chain ID:</b> <code>${chain.chain}</code>
<b>Symbol:</b> ${chain.symbol}
<b>Price:</b> $${chain.price.toLocaleString()}

<b>Inbound:</b> ${inboundStatus}
<b>Max Outbound:</b> ${chain.maxOutbound.toLocaleString()}
<b>Min Outbound:</b> ${chain.minOutbound}

<b>Gas:</b> ${chain.gas}
<b>Gwei:</b> ${chain.gwei}

<b>Explorer:</b> ${explorerLink}
<b>RPC:</b> ${chain.rpcs[0] || 'N/A'}
    `.trim();
  }

  /**
   * Send a test message to verify bot is working
   */
  async sendTestMessage(): Promise<void> {
    const message = '✅ NewChain Detector Bot is now active and monitoring for new chains!';

    try {
      await this.bot.sendMessage(this.chatId, message);
    } catch (error) {
      throw new Error(`Failed to send test message: ${error}`);
    }
  }

  /**
   * Send error notification
   */
  async notifyError(error: Error): Promise<void> {
    const message = `
<b>⚠️ Error Occurred</b>

<code>${error.message}</code>

The bot will continue monitoring...
    `.trim();

    try {
      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'HTML',
      });
    } catch (err) {
      console.error('Failed to send error notification:', err);
    }
  }
}
