import { Observable } from 'rxjs';
import { Message } from './message.dto';

export interface VendingMachine {
  readonly onMessage: Observable<Message>;

  enable(): Promise<void>;
  disable(): Promise<void>;

  refreshCredit(): Promise<void>;

  acceptVend(price: number): Promise<void>;
  stopVend(): Promise<void>;
}
