# Deployment Guide - Debian 11

This guide explains how to deploy the NewChain Detector bot on a Debian 11 server using Supervisor.

## Prerequisites

- A Debian 11 server with sudo/root access
- Your Telegram bot token
- Your Telegram channel/chat ID

## Quick Deployment

### Option 1: Automated Deployment (Recommended)

1. **Clone or upload the project to your server**
```bash
cd /tmp
git clone <your-repo-url> newchain-detector
# or upload via scp/sftp
```

2. **Run the deployment script**
```bash
cd newchain-detector
sudo chmod +x deployment/deploy.sh
sudo ./deployment/deploy.sh
```

The script will automatically:
- Install Node.js 18.x
- Install Supervisor
- Create a dedicated user (`newchain`)
- Set up the application in `/opt/newchain-detector`
- Configure logging in `/var/log/newchain-detector`
- Set up Supervisor configuration

3. **Configure your credentials**
```bash
sudo nano /opt/newchain-detector/.env
```

Edit the following values:
```env
TELEGRAM_BOT_TOKEN=your_actual_bot_token
TELEGRAM_CHAT_ID=your_actual_channel_id
```

4. **Initialize the database**
```bash
cd /opt/newchain-detector
sudo -u newchain npm run init
```

5. **Start the bot**
```bash
sudo supervisorctl start newchain-detector
```

### Option 2: Manual Deployment

If you prefer manual installation:

1. **Install Node.js 18.x**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt-get install -y nodejs
```

2. **Install Supervisor**
```bash
sudo apt-get update
sudo apt-get install -y supervisor
sudo systemctl enable supervisor
sudo systemctl start supervisor
```

3. **Create application user**
```bash
sudo useradd -r -s /bin/false newchain
```

4. **Set up application directory**
```bash
sudo mkdir -p /opt/newchain-detector
sudo mkdir -p /var/log/newchain-detector
```

5. **Copy application files**
```bash
sudo cp -r ./* /opt/newchain-detector/
cd /opt/newchain-detector
```

6. **Install dependencies and build**
```bash
sudo npm install --production
sudo npm run build
```

7. **Configure environment**
```bash
sudo cp .env.example .env
sudo nano .env
```

8. **Set permissions**
```bash
sudo chown -R newchain:newchain /opt/newchain-detector
sudo chown -R newchain:newchain /var/log/newchain-detector
```

9. **Copy supervisor configuration**
```bash
sudo cp deployment/newchain-detector.conf /etc/supervisor/conf.d/
sudo supervisorctl reread
sudo supervisorctl update
```

10. **Initialize database**
```bash
cd /opt/newchain-detector
sudo -u newchain npm run init
```

11. **Start the bot**
```bash
sudo supervisorctl start newchain-detector
```

## Managing the Bot

### Check status
```bash
sudo supervisorctl status newchain-detector
```

### Start the bot
```bash
sudo supervisorctl start newchain-detector
```

### Stop the bot
```bash
sudo supervisorctl stop newchain-detector
```

### Restart the bot
```bash
sudo supervisorctl restart newchain-detector
```

### View live logs
```bash
# Access logs
sudo tail -f /var/log/newchain-detector/access.log

# Error logs
sudo tail -f /var/log/newchain-detector/error.log
```

### View all supervisor logs
```bash
sudo supervisorctl tail -f newchain-detector
```

## Updating the Bot

1. **Stop the bot**
```bash
sudo supervisorctl stop newchain-detector
```

2. **Pull latest changes or upload new files**
```bash
cd /opt/newchain-detector
# If using git:
sudo -u newchain git pull
# Or copy new files manually
```

3. **Rebuild**
```bash
sudo -u newchain npm install --production
sudo -u newchain npm run build
```

4. **Restart the bot**
```bash
sudo supervisorctl restart newchain-detector
```

## Troubleshooting

### Bot not starting
1. Check supervisor status:
```bash
sudo supervisorctl status newchain-detector
```

2. Check error logs:
```bash
sudo tail -50 /var/log/newchain-detector/error.log
```

3. Verify .env configuration:
```bash
sudo cat /opt/newchain-detector/.env
```

### Database issues
1. Check database file permissions:
```bash
ls -la /opt/newchain-detector/data/
```

2. Reinitialize database:
```bash
cd /opt/newchain-detector
sudo -u newchain npm run init
```

### Telegram connection issues
1. Verify bot token and channel ID in `.env`
2. Ensure bot is added as admin to the channel (for channels)
3. Check logs for detailed error messages

### Permission issues
```bash
sudo chown -R newchain:newchain /opt/newchain-detector
sudo chown -R newchain:newchain /var/log/newchain-detector
```

## Monitoring

### Set up email alerts (optional)

Edit supervisor configuration:
```bash
sudo nano /etc/supervisor/supervisord.conf
```

Add email configuration:
```ini
[eventlistener:crashmail]
command=/usr/local/bin/crashmail -a -m your-email@example.com
events=PROCESS_STATE
```

### Log rotation (recommended)

Create log rotation configuration:
```bash
sudo nano /etc/logrotate.d/newchain-detector
```

Add:
```
/var/log/newchain-detector/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    copytruncate
}
```

## Security Recommendations

1. **Firewall**: Only allow necessary ports (SSH)
```bash
sudo ufw allow 22/tcp
sudo ufw enable
```

2. **Keep system updated**
```bash
sudo apt-get update && sudo apt-get upgrade -y
```

3. **Secure .env file**
```bash
sudo chmod 600 /opt/newchain-detector/.env
```

4. **Regular backups** of database
```bash
sudo cp /opt/newchain-detector/data/chains.db /backup/chains-$(date +%Y%m%d).db
```

## Uninstalling

To completely remove the bot:

```bash
# Stop the bot
sudo supervisorctl stop newchain-detector

# Remove supervisor configuration
sudo rm /etc/supervisor/conf.d/newchain-detector.conf
sudo supervisorctl reread
sudo supervisorctl update

# Remove application files
sudo rm -rf /opt/newchain-detector
sudo rm -rf /var/log/newchain-detector

# Remove user (optional)
sudo userdel newchain
```
