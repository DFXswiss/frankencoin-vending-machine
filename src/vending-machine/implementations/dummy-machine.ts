import { Observable, Subject } from 'rxjs';
import { Logger } from '../../util/logger';
import { Message, MessageType } from '../message.dto';
import { VendingMachine } from '../vending-machine';

export class DummyMachine implements VendingMachine {
  private readonly logger = new Logger('Dummy');

  private readonly $message = new Subject<Message>();

  readonly onMessage: Observable<Message> = this.$message.asObservable();

  async enable(): Promise<void> {
    this.logger.info('Enable');

    setTimeout(() => this.$message.next({ type: MessageType.PRODUCT, payload: { product: 1, price: 1.5 } }), 1000);
  }

  async disable(): Promise<void> {
    this.logger.info('Disable');
  }

  async acceptVend(price: number): Promise<void> {
    this.logger.info(`Accept vend for ${price}`);
  }

  async stopVend(): Promise<void> {
    this.logger.info('Stop vend');
  }
}
