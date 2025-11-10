#!/bin/bash

# NewChain Detector - Deployment Script for Debian 11
# This script automates the deployment of the bot on a Debian 11 server

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  NewChain Detector - Deployment${NC}"
echo -e "${GREEN}========================================${NC}\n"

# Configuration
APP_NAME="newchain-detector"
APP_USER="newchain"
APP_DIR="/opt/${APP_NAME}"
LOG_DIR="/var/log/${APP_NAME}"
SUPERVISOR_CONF="/etc/supervisor/conf.d/${APP_NAME}.conf"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
   echo -e "${RED}Please run as root (use sudo)${NC}"
   exit 1
fi

echo -e "${YELLOW}[1/10] Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

echo -e "${YELLOW}[2/10] Installing Node.js 18.x...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi
node --version
npm --version

echo -e "${YELLOW}[3/10] Installing supervisor...${NC}"
apt-get install -y supervisor
systemctl enable supervisor
systemctl start supervisor

echo -e "${YELLOW}[4/10] Creating application user...${NC}"
if ! id -u "$APP_USER" &>/dev/null; then
    useradd -r -s /bin/false "$APP_USER"
    echo -e "${GREEN}User ${APP_USER} created${NC}"
else
    echo -e "${GREEN}User ${APP_USER} already exists${NC}"
fi

echo -e "${YELLOW}[5/10] Creating application directory...${NC}"
mkdir -p "$APP_DIR"
mkdir -p "$LOG_DIR"

echo -e "${YELLOW}[6/10] Copying application files...${NC}"
# Assuming the script is run from the project directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"
echo "Copying from: $SCRIPT_DIR"

# Copy all files
rsync -av --exclude 'node_modules' --exclude 'dist' --exclude '.git' --exclude 'data' "$SCRIPT_DIR/" "$APP_DIR/"

echo -e "${YELLOW}[7/10] Installing dependencies and building...${NC}"
cd "$APP_DIR"
npm install --production
npm run build

echo -e "${YELLOW}[8/10] Setting up environment file...${NC}"
if [ ! -f "$APP_DIR/.env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > "$APP_DIR/.env" << 'EOF'
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# API Configuration
API_URL=https://backend.gas.zip/v2/chains

# Polling Configuration (in milliseconds)
POLLING_INTERVAL=10000

# Database Configuration
DATABASE_PATH=/opt/newchain-detector/data/chains.db

# Silent Mode (set to true to load DB without sending notifications)
SILENT_MODE=false
EOF
    echo -e "${RED}⚠️  IMPORTANT: Edit $APP_DIR/.env with your Telegram credentials!${NC}"
else
    echo -e "${GREEN}.env file already exists${NC}"
fi

echo -e "${YELLOW}[9/10] Setting permissions...${NC}"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$LOG_DIR"
chmod -R 755 "$APP_DIR"

echo -e "${YELLOW}[10/10] Setting up supervisor...${NC}"
cp "$APP_DIR/deployment/${APP_NAME}.conf" "$SUPERVISOR_CONF"

# Update supervisor configuration
supervisorctl reread
supervisorctl update

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Edit the .env file with your credentials:"
echo -e "   ${GREEN}sudo nano $APP_DIR/.env${NC}"
echo -e ""
echo -e "2. Initialize the database:"
echo -e "   ${GREEN}cd $APP_DIR && sudo -u $APP_USER npm run init${NC}"
echo -e ""
echo -e "3. Start the bot:"
echo -e "   ${GREEN}sudo supervisorctl start ${APP_NAME}${NC}"
echo -e ""
echo -e "${YELLOW}Useful commands:${NC}"
echo -e "  Check status:   ${GREEN}sudo supervisorctl status ${APP_NAME}${NC}"
echo -e "  View logs:      ${GREEN}sudo tail -f $LOG_DIR/access.log${NC}"
echo -e "  View errors:    ${GREEN}sudo tail -f $LOG_DIR/error.log${NC}"
echo -e "  Restart bot:    ${GREEN}sudo supervisorctl restart ${APP_NAME}${NC}"
echo -e "  Stop bot:       ${GREEN}sudo supervisorctl stop ${APP_NAME}${NC}"
