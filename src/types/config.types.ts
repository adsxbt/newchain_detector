/**
 * Application configuration
 */
export interface AppConfig {
  telegram: TelegramConfig;
  api: ApiConfig;
  polling: PollingConfig;
  database: DatabaseConfig;
  silentMode: boolean;
}

/**
 * Telegram bot configuration
 */
export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

/**
 * API configuration
 */
export interface ApiConfig {
  url: string;
}

/**
 * Polling configuration
 */
export interface PollingConfig {
  intervalMs: number;
}

/**
 * Database configuration
 */
export interface DatabaseConfig {
  path: string;
}
