import dotenv from 'dotenv';
import { AppConfig } from '../types';

// Load environment variables
dotenv.config();

/**
 * Validates required environment variables
 */
function validateEnv(): void {
  const required = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID', 'API_URL'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

/**
 * Application configuration loaded from environment variables
 */
export function getConfig(): AppConfig {
  validateEnv();

  return {
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN!,
      chatId: process.env.TELEGRAM_CHAT_ID!,
    },
    api: {
      url: process.env.API_URL!,
    },
    polling: {
      intervalMs: parseInt(process.env.POLLING_INTERVAL || '10000', 10),
    },
    database: {
      path: process.env.DATABASE_PATH || './data/chains.db',
    },
    silentMode: process.env.SILENT_MODE === 'true',
  };
}
