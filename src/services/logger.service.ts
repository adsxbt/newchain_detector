/**
 * Logger service for consistent logging throughout the application
 */
export class LoggerService {
  private prefix: string;

  constructor(prefix = 'NewChain Detector') {
    this.prefix = prefix;
  }

  /**
   * Get formatted timestamp
   */
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Log info message
   */
  info(message: string, ...args: any[]): void {
    console.log(`[${this.getTimestamp()}] [INFO] [${this.prefix}]`, message, ...args);
  }

  /**
   * Log success message
   */
  success(message: string, ...args: any[]): void {
    console.log(`[${this.getTimestamp()}] [SUCCESS] [${this.prefix}]`, message, ...args);
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: any[]): void {
    console.warn(`[${this.getTimestamp()}] [WARN] [${this.prefix}]`, message, ...args);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown): void {
    console.error(`[${this.getTimestamp()}] [ERROR] [${this.prefix}]`, message);
    if (error) {
      console.error(error);
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, ...args: any[]): void {
    if (process.env.DEBUG === 'true') {
      console.debug(`[${this.getTimestamp()}] [DEBUG] [${this.prefix}]`, message, ...args);
    }
  }
}
