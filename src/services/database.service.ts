import Database from 'better-sqlite3';
import { Chain, ChainRecord } from '../types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Database service for managing chain persistence
 */
export class DatabaseService {
  private db: Database.Database;

  constructor(dbPath: string) {
    // Ensure data directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.initialize();
  }

  /**
   * Initialize database schema
   */
  private initialize(): void {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS chains (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chain INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        symbol TEXT NOT NULL,
        decimals INTEGER NOT NULL,
        mainnet INTEGER NOT NULL,
        price REAL NOT NULL,
        bal TEXT NOT NULL,
        gas TEXT NOT NULL,
        gwei TEXT NOT NULL,
        inbound INTEGER NOT NULL,
        maxInbound REAL NOT NULL,
        maxInboundNative TEXT NOT NULL,
        maxOutbound REAL NOT NULL,
        maxOutboundNative TEXT NOT NULL,
        minOutbound REAL NOT NULL,
        minOutboundNative TEXT NOT NULL,
        explorer TEXT,
        rpcs TEXT NOT NULL,
        short INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `;

    this.db.exec(createTableQuery);

    // Create index on chain ID for faster lookups
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_chain ON chains(chain)');
  }

  /**
   * Save a new chain to the database
   */
  saveChain(chain: Chain): void {
    const now = new Date().toISOString();

    const insertQuery = `
      INSERT INTO chains (
        chain, name, symbol, decimals, mainnet, price, bal, gas, gwei,
        inbound, maxInbound, maxInboundNative, maxOutbound, maxOutboundNative,
        minOutbound, minOutboundNative, explorer, rpcs, short, createdAt, updatedAt
      ) VALUES (
        @chain, @name, @symbol, @decimals, @mainnet, @price, @bal, @gas, @gwei,
        @inbound, @maxInbound, @maxInboundNative, @maxOutbound, @maxOutboundNative,
        @minOutbound, @minOutboundNative, @explorer, @rpcs, @short, @createdAt, @updatedAt
      )
    `;

    const stmt = this.db.prepare(insertQuery);
    stmt.run({
      chain: chain.chain,
      name: chain.name,
      symbol: chain.symbol,
      decimals: chain.decimals,
      mainnet: chain.mainnet ? 1 : 0,
      price: chain.price,
      bal: chain.bal,
      gas: chain.gas,
      gwei: chain.gwei,
      inbound: chain.inbound ? 1 : 0,
      maxInbound: chain.maxInbound,
      maxInboundNative: chain.maxInboundNative,
      maxOutbound: chain.maxOutbound,
      maxOutboundNative: chain.maxOutboundNative,
      minOutbound: chain.minOutbound,
      minOutboundNative: chain.minOutboundNative,
      explorer: chain.explorer || null,
      rpcs: JSON.stringify(chain.rpcs),
      short: chain.short,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Update an existing chain in the database
   */
  updateChain(chain: Chain): void {
    const now = new Date().toISOString();

    const updateQuery = `
      UPDATE chains SET
        name = @name,
        symbol = @symbol,
        decimals = @decimals,
        mainnet = @mainnet,
        price = @price,
        bal = @bal,
        gas = @gas,
        gwei = @gwei,
        inbound = @inbound,
        maxInbound = @maxInbound,
        maxInboundNative = @maxInboundNative,
        maxOutbound = @maxOutbound,
        maxOutboundNative = @maxOutboundNative,
        minOutbound = @minOutbound,
        minOutboundNative = @minOutboundNative,
        explorer = @explorer,
        rpcs = @rpcs,
        short = @short,
        updatedAt = @updatedAt
      WHERE chain = @chain
    `;

    const stmt = this.db.prepare(updateQuery);
    stmt.run({
      chain: chain.chain,
      name: chain.name,
      symbol: chain.symbol,
      decimals: chain.decimals,
      mainnet: chain.mainnet ? 1 : 0,
      price: chain.price,
      bal: chain.bal,
      gas: chain.gas,
      gwei: chain.gwei,
      inbound: chain.inbound ? 1 : 0,
      maxInbound: chain.maxInbound,
      maxInboundNative: chain.maxInboundNative,
      maxOutbound: chain.maxOutbound,
      maxOutboundNative: chain.maxOutboundNative,
      minOutbound: chain.minOutbound,
      minOutboundNative: chain.minOutboundNative,
      explorer: chain.explorer || null,
      rpcs: JSON.stringify(chain.rpcs),
      short: chain.short,
      updatedAt: now,
    });
  }

  /**
   * Get all chain IDs currently in the database
   */
  getAllChainIds(): Set<number> {
    const query = 'SELECT chain FROM chains';
    const rows = this.db.prepare(query).all() as Array<{ chain: number }>;
    return new Set(rows.map((row) => row.chain));
  }

  /**
   * Get a specific chain by its chain ID
   */
  getChainById(chainId: number): ChainRecord | null {
    const query = 'SELECT * FROM chains WHERE chain = ?';
    const row = this.db.prepare(query).get(chainId) as any;

    if (!row) {
      return null;
    }

    return this.mapRowToChainRecord(row);
  }

  /**
   * Get all chains from the database
   */
  getAllChains(): ChainRecord[] {
    const query = 'SELECT * FROM chains ORDER BY createdAt DESC';
    const rows = this.db.prepare(query).all() as any[];

    return rows.map((row) => this.mapRowToChainRecord(row));
  }

  /**
   * Check if a chain exists by its chain ID
   */
  chainExists(chainId: number): boolean {
    const query = 'SELECT 1 FROM chains WHERE chain = ? LIMIT 1';
    const result = this.db.prepare(query).get(chainId);
    return result !== undefined;
  }

  /**
   * Map database row to ChainRecord object
   */
  private mapRowToChainRecord(row: any): ChainRecord {
    return {
      id: row.id,
      chain: row.chain,
      name: row.name,
      symbol: row.symbol,
      decimals: row.decimals,
      mainnet: row.mainnet === 1,
      price: row.price,
      bal: row.bal,
      gas: row.gas,
      gwei: row.gwei,
      inbound: row.inbound === 1,
      maxInbound: row.maxInbound,
      maxInboundNative: row.maxInboundNative,
      maxOutbound: row.maxOutbound,
      maxOutboundNative: row.maxOutboundNative,
      minOutbound: row.minOutbound,
      minOutboundNative: row.minOutboundNative,
      explorer: row.explorer,
      rpcs: JSON.parse(row.rpcs),
      short: row.short,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}
