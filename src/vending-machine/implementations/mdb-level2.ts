import { Observable, Subject } from 'rxjs';
import { ReadlineParser, SerialPort } from 'serialport';
import Config from '../../config';
import { Logger } from '../../util/logger';
import { Util } from '../../util/util';
import { Message, MessageType } from '../message.dto';
import { VendingMachine } from '../vending-machine';

export class MdbLevel2 implements VendingMachine {
  private readonly logger: Logger;

  private readonly port: SerialPort;
  private readonly parser: ReadlineParser;

  private readonly $message = new Subject<Message>();

  constructor() {
    if (!Config.mdb.path || !Config.mdb.baudRate) throw new Error('Invalid MDB settings');

    this.logger = new Logger('MdbLevel2');

    this.port = new SerialPort({ path: Config.mdb.path, baudRate: +Config.mdb.baudRate });
    this.parser = new ReadlineParser();
    this.port.pipe(this.parser);
    this.parser.on('data', (d) => this.onRead(d));
  }

  // --- PUBLIC API --- //
  readonly onMessage: Observable<Message> = this.$message.asObservable();

  async enable(): Promise<void> {
    await this.onWrite('1');
  }

  async disable(): Promise<void> {
    await this.onWrite('0');
  }

  async acceptVend(price: number): Promise<void> {
    await this.onWrite(`VEND,${price}`);
  }

  async stopVend(): Promise<void> {
    await this.onWrite(`STOP`);

    await this.onEnable();
  }

  // --- PRIVATE API --- //

  private async onEnable() {
    await Util.sleep(2);
    await this.setCredit(10);
  }

  private async setCredit(credit: number): Promise<void> {
    await this.onWrite(`START,${credit}`);
  }

  // --- HELPER METHODS --- //
  private async onWrite(data: string): Promise<boolean> {
    return this.port.write(`C,${data}\n`);
  }

  private async onRead(data: string) {
    this.logger.debug(data);

    const [sender, message, ...payload] = data.replace('\r', '').split(',');
    if (sender !== 'c') return;

    if (message.includes('0')) {
      await this.enable();
    }

    switch (message) {
      case 'STATUS': {
        switch (payload[0]) {
          case 'ENABLED': {
            await this.onEnable();
            break;
          }

          case 'VEND': {
            const [_, amount, productNr] = payload;
            this.$message.next({ type: MessageType.PRODUCT, payload: { product: +productNr, price: +amount } });
            break;
          }
        }
        break;
      }

      case 'ERR': {
        if (payload[0].includes('cashless is on')) {
          await this.onEnable();
        } else if (payload[0].includes('START')) {
          await this.disable(); // restart
        } else {
          this.$message.next({ type: MessageType.ERROR, payload: payload.join(',') });
        }
        break;
      }
    }
  }
}
