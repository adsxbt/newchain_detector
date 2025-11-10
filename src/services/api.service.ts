import axios, { AxiosInstance } from 'axios';
import { Chain, ChainsApiResponse } from '../types';

/**
 * API service for fetching blockchain chains data
 */
export class ApiService {
  private client: AxiosInstance;
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
    this.client = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Fetch all chains from the API
   */
  async fetchChains(): Promise<Chain[]> {
    try {
      const response = await this.client.get<ChainsApiResponse>(this.apiUrl);

      if (!response.data || !response.data.chains) {
        throw new Error('Invalid API response format');
      }

      return response.data.chains;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `API request failed: ${error.message} (${error.response?.status || 'unknown status'})`
        );
      }
      throw error;
    }
  }

  /**
   * Fetch chains with retry logic
   */
  async fetchChainsWithRetry(maxRetries = 3): Promise<Chain[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.fetchChains();
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${attempt}/${maxRetries} failed:`, error);

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `Failed to fetch chains after ${maxRetries} attempts: ${lastError?.message}`
    );
  }
}
