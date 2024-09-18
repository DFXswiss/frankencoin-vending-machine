import { Observable, Subject } from 'rxjs';
import Config from '../../config';
import { Logger } from '../../util/logger';
import { Util } from '../../util/util';
import { Adapter } from '../adapter.interface';
import { Message, MessageType } from '../message.dto';
import { VendingMachine } from '../vending-machine.interface';

export class MdbLevel2 implements VendingMachine {
  private readonly logger: Logger;
  private readonly $message = new Subject<Message>();

  constructor(private readonly adapter: Adapter) {
    this.logger = new Logger('MDB Level 2');
    adapter.onRead((d) => this.onRead(d));
  }

  // --- PUBLIC API --- //
  readonly onMessage: Observable<Message> = this.$message.asObservable();

  async enable(): Promise<void> {
    this.adapter.onWrite('1');
    this.logger.debug('Enable');
  }

  async disable(): Promise<void> {
    this.adapter.onWrite('0');
    this.logger.debug('Disable');
  }

  async acceptVend(price: number): Promise<void> {
    this.adapter.onWrite(`VEND,${price}`);
    this.logger.debug(`Accept vend for price ${price}`);
  }

  async stopVend(): Promise<void> {
    this.adapter.onWrite(`STOP`);
    this.logger.debug('Stop vend');

    await this.onEnable();
  }

  async refreshCredit(): Promise<void> {
    await this.setCredit(Config.pos.credit);
  }

  // --- PRIVATE API --- //

  private async onEnable() {
    await Util.sleep(2);
    await this.setCredit(Config.pos.credit);
  }

  private async setCredit(credit: number): Promise<void> {
    this.adapter.onWrite(`START,${credit}`);
    this.logger.debug(`Set credit ${credit}`);
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
        } else if (payload[0].includes('START') || payload[0].includes('VEND 5')) {
          await this.disable(); // restart
        } else if (payload[0].includes('VEND 1') || payload[0].includes('VEND 3')) {
          await this.onEnable();
        } else {
          this.$message.next({ type: MessageType.ERROR, payload: payload.join(',') });
        }
        break;
      }

      case 'SALE': {
        //vend products over an other device
        console.log('Verkauf über Münzzähler getätigt'); // Todo: globaler Verkaufszähler implementieren
      }

      case 'SUCCESS': {
        //vending successful
        // Todo: globaler Verkaufszähler implementieren, the same as one on top
      }
    }
  }
}
