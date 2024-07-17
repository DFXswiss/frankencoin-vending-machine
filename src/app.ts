import { exit } from 'process';
import { Api } from './adapters/api/api';
import { VendingMachine } from './adapters/vending-machine';
import Config from './config';
import { Logger } from './util/logger';

class App {
  private readonly logger: Logger;
  private readonly machine: VendingMachine;
  private readonly api: Api;

  constructor() {
    this.logger = new Logger('Vending Machine');
    this.machine = new VendingMachine();
    this.api = new Api();
  }

  async run() {
    const ports = await this.machine.listPorts();
    this.logger.info('Available ports:', ports);

    const links = await this.api.getAllPaymentLinks();
    let link =
      links.find((l) => l.externalId === Config.deviceId) ?? (await this.api.createPaymentLink(Config.deviceId));

    // create a payment
    link = await this.api.createPayment(link.id, 10, 'CHF');
    this.logger.info('Link:', link);

    // check the status
    link = await this.api.getPaymentLink(link.id);
    this.logger.info('Link:', link);

    // cancel the payment
    link = await this.api.cancelPayment(link.id);
    this.logger.info('Link:', link);
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
