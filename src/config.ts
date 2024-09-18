import { config } from 'dotenv';
import { hostname } from 'os';
import { AdapterType, BusType } from './vending-machine/vending-machine.factory';

class ConfigClass {
  deviceId = hostname();
  pos = {
    name: process.env.POS_NAME ?? 'default',
    bus: (process.env.POS_BUS ?? BusType.MDB_LEVEL_2) as BusType,
    adapter: (process.env.POS_ADAPTER ?? AdapterType.DUMMY) as AdapterType,
    timeout: +(process.env.POS_TIMEOUT_S ?? 60),
    currency: process.env.POS_CURRENCY ?? 'CHF',
    credit: +(process.env.POS_CREDIT ?? 999),
  };

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

  mdb = {
    path: process.env.MDB_PATH,
    baudRate: process.env.MDB_BAUD_RATE,
  };
}

config();
const Config = new ConfigClass();
export default Config;
