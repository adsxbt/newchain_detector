# NewChain Detector Bot

A TypeScript-based Telegram bot that monitors blockchain chains from the gas.zip API and sends notifications when new chains are detected.

## Features

- Real-time monitoring of blockchain chains
- SQLite database for persistent chain tracking
- Automatic detection of new chains
- Telegram notifications with detailed chain information (supports both private chats and channels)
- Silent mode for database initialization without notifications
- Clean, modular architecture with separation of concerns
- Error handling and retry logic
- Configurable polling interval

## Architecture

The project follows clean architecture principles with clear separation of responsibilities:

```
src/
├── types/              # TypeScript interfaces and types
│   ├── chain.types.ts
│   └── config.types.ts
├── config/             # Application configuration
│   └── config.ts
├── services/           # Business logic services
│   ├── api.service.ts          # API communication
│   ├── database.service.ts     # SQLite operations
│   ├── telegram.service.ts     # Telegram notifications
│   ├── chain-detector.service.ts  # Chain comparison logic
│   └── logger.service.ts       # Logging utility
├── app.ts              # Main orchestrator
└── index.ts            # Entry point
```

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Telegram bot token (from [@BotFather](https://t.me/BotFather))
- Your Telegram chat ID or channel ID

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id_or_channel_id
API_URL=https://backend.gas.zip/v2/chains
POLLING_INTERVAL=10000
DATABASE_PATH=./data/chains.db
SILENT_MODE=false
```

### Telegram Configuration

#### For Private Chat:
- `TELEGRAM_CHAT_ID`: Your personal chat ID (numeric, e.g., `123456789`)
- Get it from [@userinfobot](https://t.me/userinfobot)

#### For Telegram Channel (Recommended):
1. Create a Telegram channel
2. Add your bot as an administrator with post permissions
3. Get the channel ID:
   - **Public channel**: Use `@channel_username` (e.g., `@mynewschain`)
   - **Private channel**: Use the numeric ID starting with `-100` (e.g., `-1001234567890`)
   - To get private channel ID: Forward a message from the channel to [@userinfobot](https://t.me/userinfobot)

Example for channel:
```env
TELEGRAM_CHAT_ID=@mynewschain
# or for private channel
TELEGRAM_CHAT_ID=-1001234567890
```

## Usage

### Initialize Database (First Time)

Before running the bot for the first time, initialize the database without sending notifications:

```bash
npm run init
```

This will:
- Fetch all chains from the API
- Save them to the database
- Skip Telegram notifications
- Show a summary of loaded chains

### Development Mode

Run with ts-node for development:
```bash
npm run dev
```

### Silent Mode

To load the database without sending notifications every time (useful for testing):

Set in `.env`:
```env
SILENT_MODE=true
```

Then run:
```bash
npm run dev
```

The bot will run normally but skip all Telegram notifications while still detecting and saving new chains to the database.

### Production Mode

Build and run the compiled version:
```bash
npm run build
npm start
```

## How It Works

1. **Initialization**: The bot connects to Telegram and initializes the SQLite database
2. **First Scan**: Fetches all current chains from the API and stores them
3. **Continuous Monitoring**: Every 10 seconds (configurable), the bot:
   - Fetches the latest chain data from the API
   - Compares chain IDs with the database
   - Detects any new chains
   - Sends Telegram notifications for new chains
   - Updates existing chain data

## Database Schema

The SQLite database stores chain information with the following structure:

- Chain ID (unique identifier)
- Name, symbol, and decimals
- Network type (mainnet/testnet)
- Price information
- Gas and gwei data
- Inbound/outbound limits
- Explorer and RPC URLs
- Timestamps (created/updated)

## Services

### ApiService
Handles HTTP requests to the gas.zip API with retry logic and error handling.

### DatabaseService
Manages SQLite database operations including:
- Schema initialization
- CRUD operations for chains
- Chain existence checks
- Chain ID retrieval

### TelegramService
Sends formatted notifications to Telegram:
- New chain alerts with detailed information
- Error notifications
- Test messages

### ChainDetectorService
Compares API data with database to identify new chains and updates existing ones.

### LoggerService
Provides consistent logging throughout the application with timestamps and log levels.

## Configuration

All configuration is managed through environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token | Required |
| `TELEGRAM_CHAT_ID` | Your Telegram chat/channel ID | Required |
| `API_URL` | Chains API endpoint | `https://backend.gas.zip/v2/chains` |
| `POLLING_INTERVAL` | Scan interval in milliseconds | `10000` (10 seconds) |
| `DATABASE_PATH` | SQLite database file path | `./data/chains.db` |
| `SILENT_MODE` | Skip Telegram notifications | `false` |

## Error Handling

The bot includes comprehensive error handling:
- API request failures with exponential backoff retry
- Database operation errors
- Telegram notification failures
- Graceful shutdown on SIGINT/SIGTERM
- Automatic error notifications via Telegram

## Scripts

- `npm run dev` - Run in development mode with ts-node
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled application
- `npm run watch` - Watch mode for TypeScript compilation
- `npm run clean` - Remove compiled files

## License

MIT
