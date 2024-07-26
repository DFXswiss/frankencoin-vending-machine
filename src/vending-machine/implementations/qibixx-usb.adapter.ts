import { ReadlineParser, SerialPort } from 'serialport';
import Config from '../../config';
import { Logger } from '../../util/logger';
import { Adapter } from '../adapter.interface';

export class QibixxUsbAdapter implements Adapter {
  private readonly logger: Logger;
  private readonly port: SerialPort;
  private readonly parser: ReadlineParser;

  constructor() {
    if (!Config.mdb.path || !Config.mdb.baudRate) throw new Error('Invalid MDB settings');

    this.port = new SerialPort({ path: Config.mdb.path, baudRate: +Config.mdb.baudRate });
    this.parser = new ReadlineParser();
    this.port.pipe(this.parser);

    this.logger = new Logger('QibixxUsbAdapter');
  }

  onRead(cb: (data: string[]) => void): void {
    this.parser.on('data', (data) => {
      this.logger.debug(`Read ${data}`);

      const [sender, ...message] = data.replace('\r', '').split(',');
      if (sender !== 'c') return;

      cb(message);
    });
  }

  onWrite(data: string): boolean {
    this.logger.debug(`Write ${data}`);

    return this.port.write(`C,${data}\n`);
  }
}
