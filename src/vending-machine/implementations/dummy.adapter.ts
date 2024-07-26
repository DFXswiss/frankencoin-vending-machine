import { Logger } from '../../util/logger';
import { Adapter } from '../adapter.interface';

export class DummyAdapter implements Adapter {
  private readonly logger = new Logger('Dummy');

  private cb?: (data: string[]) => void;

  onRead(cb: (data: string[]) => void): void {
    this.cb = cb;
  }

  onWrite(data: string): boolean {
    this.logger.info(`Write ${data}`);

    if (['1', '0'].includes(data)) {
      setTimeout(() => this.cb?.(['STATUS', 'ENABLED']), 1000);
    } else if (data.includes('START')) {
      setTimeout(() => this.cb?.(['STATUS', 'VEND', '1.5', '13']), 1000);
    }

    return true;
  }
}
