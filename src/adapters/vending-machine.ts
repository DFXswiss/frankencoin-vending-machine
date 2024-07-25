import { Observable, Subject } from 'rxjs';
import { ReadlineParser, SerialPort } from 'serialport';
import Config from '../config';
import { Util } from '../util/util';

export enum MessageType {
  ENABLED = 'Enabled',
  PRODUCT = 'Product',
  ERROR = 'Error',
}

export interface ProductPayload {
  product: number;
  price: number;
}

export interface EnabledMessage {
  type: MessageType.ENABLED;
}

export interface ProductMessage {
  type: MessageType.PRODUCT;
  payload: ProductPayload;
}

export interface ErrorMessage {
  type: MessageType.ERROR;
  payload: string;
}

export type Message = EnabledMessage | ProductMessage | ErrorMessage;

export class VendingMachine {
  private readonly port: SerialPort;
  private readonly parser: ReadlineParser;

  private readonly $message = new Subject<Message>();

  constructor() {
    if (!Config.mdb.path || !Config.mdb.baudRate) throw new Error('Invalid MDB settings');
    console.log(Config.mdb.path, Config.mdb.baudRate);

    this.port = new SerialPort({ path: Config.mdb.path, baudRate: +Config.mdb.baudRate });
    this.parser = new ReadlineParser();
    this.port.pipe(this.parser);
    this.parser.on('data', (d) => this.onRead(d));
  }

  readonly onMessage: Observable<Message> = this.$message.asObservable();

  async enable(): Promise<void> {
    await this.onWrite('1');
  }

  async disable(): Promise<void> {
    await this.onWrite('0');
  }

  async setCredit(credit: number): Promise<void> {
    await this.onWrite(`START,${credit}`);
  }

  async acceptVend(price: number): Promise<void> {
    await this.onWrite(`VEND,${price}`);
  }

  async stopVending(): Promise<void> {
    await this.onWrite(`STOP`); //Guthaben zurückerstatten
    Util.sleep(1);
    this.setCredit(10);//Guthaben von allfälliger Zahlung gutschreiben
  }

  // --- HELPER METHODS --- //
  private async onWrite(data: string): Promise<boolean> {
    return this.port.write(`C,${data}\n`);
  }

  private async onRead(data: string) {
    console.log(data);
    const [sender, message, ...payload] = data.replace('\r', '').split(',');
    if (sender !== 'c') return;

    if (message.includes('0')) {
      await this.enable();
    }

    switch (message) {
      case 'STATUS': {

        switch (payload[0]) {
          case 'ENABLED': {
            this.$message.next({ type: MessageType.ENABLED });
            break;
          }
          case 'VEND': {
            const [_, amount, productNr] = payload;
            this.$message.next({ type: MessageType.PRODUCT, payload: { product: +productNr, price: +amount } });
            break;
          }
          default:
            //Do nothing
            break;
        }
        break;
      }
      // TODO: vend cancel/expire?

      case 'ERR': {
        if (payload[0].includes('cashless is on')) {
          this.$message.next({ type: MessageType.ENABLED });
        } else if (payload[0].includes('START')) {
          await this.disable() //Neustart
        } else this.$message.next({ type: MessageType.ERROR, payload: payload.join(',') });
        break;
      }

    }
  }
}


