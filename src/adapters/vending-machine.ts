import { Observable, Subject } from 'rxjs';
import { SerialPort } from 'serialport';
import Config from '../config';

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

  private readonly $message = new Subject<Message>();

  constructor() {
    if (!Config.mdb.path || !Config.mdb.baudRate) throw new Error('Invalid MDB settings');

    this.port = new SerialPort({ path: Config.mdb.path, baudRate: +Config.mdb.baudRate });
    this.port.on('data', (d) => this.onRead(d));
  }

  isEnabled: boolean = false;

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

  // --- HELPER METHODS --- //
  private async onWrite(data: string): Promise<boolean> {
    return this.port.write(`C,${data}\n`);
  }

  private async onRead(data: string) {
    const [sender, message, ...payload] = data.split(',');
    if (sender !== 'c') return;

    switch (message) {
      case 'STATUS':
        if (payload[0] === 'ENABLED') this.$message.next({ type: MessageType.ENABLED });
        break;

      case 'VEND':
        // TODO
        break;

      // TODO: vend cancel/expire?

      case 'ERR':
        if (payload[0]?.includes('is on')) {
          this.$message.next({ type: MessageType.ENABLED });
        } else {
          this.$message.next({ type: MessageType.ERROR, payload: payload.join(',') });
        }

        break;
    }
  }
}
