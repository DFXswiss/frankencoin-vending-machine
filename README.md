# FrankencoinPay Vending Machine

FrankencoinPay POS code for MDB vending machines

## Hardware Setup (on Raspberry Pi)

1. Install Raspberry Pi OS lite (32-bit)
   - Enable SSH and Wifi
   - Configure username/password
1. Install Node.js
1. Download this git repo and dist code (from workflow)
1. Install npm packages
1. Enable serial port (raspi-config)
1. Setup pm2
   - `sudo npm install -g pm2`
   - `sudo pm2 startup`
   - `sudo pm2 start dist/src/app.js`
   - `sudo pm2 save`
