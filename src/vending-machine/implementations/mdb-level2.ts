import { Observable, Subject } from 'rxjs';
import { Util } from '../../util/util';
import { Adapter } from '../adapter.interface';
import { Message, MessageType } from '../message.dto';
import { VendingMachine } from '../vending-machine.interface';

export class MdbLevel2 implements VendingMachine {
  private readonly $message = new Subject<Message>();

  constructor(private readonly adapter: Adapter) {
    adapter.onRead((d) => this.onRead(d));
  }

  // --- PUBLIC API --- //
  readonly onMessage: Observable<Message> = this.$message.asObservable();

  async enable(): Promise<void> {
    this.adapter.onWrite('1');
  }

  async disable(): Promise<void> {
    this.adapter.onWrite('0');
  }

  async acceptVend(price: number): Promise<void> {
    this.adapter.onWrite(`VEND,${price}`);
  }

  async stopVend(): Promise<void> {
    this.adapter.onWrite(`STOP`);

    await this.onEnable();
  }

  // --- PRIVATE API --- //

  private async onEnable() {
    await Util.sleep(2);
    await this.setCredit(10);
  }

  private async setCredit(credit: number): Promise<void> {
    this.adapter.onWrite(`START,${credit}`);
  }

  // --- HELPER METHODS --- //
  private async onRead([message, ...payload]: string[]) {
    switch (message) {
      case '0': {
        await this.enable();
      }

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
