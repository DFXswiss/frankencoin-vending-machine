import { config } from 'dotenv';
import { hostname } from 'os';

class ConfigClass {
  deviceId = hostname();

  logger = {
    printConsole: true,
    printFile: true,
    filePath: process.env.LOG_FILE_PATH ?? 'vending-machine.log',
  };

  api = {
    url: process.env.API_URL,
    version: process.env.API_VERSION,
    address: process.env.API_ADDRESS,
    signature: process.env.API_SIGNATURE,
  };
}

config();
const Config = new ConfigClass();
export default Config;
