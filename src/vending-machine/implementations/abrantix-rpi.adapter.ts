import { Adapter } from '../adapter.interface';

export class QibixxUsbAdapter implements Adapter {
  onRead(cb: (data: string[]) => void): void {
    throw new Error('TODO: method not implemented.');
  }

  onWrite(data: string): boolean {
    throw new Error('TODO: method not implemented.');
  }
}
