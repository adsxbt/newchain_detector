# Deployment Files

This directory contains all files needed for production deployment on Debian 11.

## Files

- **`newchain-detector.conf`** - Supervisor configuration file
- **`deploy.sh`** - Automated deployment script (run with sudo)
- **`DEPLOYMENT.md`** - Complete deployment guide with troubleshooting

## Quick Start

```bash
sudo ./deploy.sh
```

This will automatically install and configure everything needed to run the bot in production.

See [DEPLOYMENT.md](DEPLOYMENT.md) for full documentation.
