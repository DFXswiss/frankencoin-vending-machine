import { exit } from 'process';
import { Api } from './api/api';
import { PaymentLinkPaymentStatus } from './api/dto';
import Config from './config';
import { Logger } from './util/logger';
import { Util } from './util/util';
import { Message, MessageType, ProductMessage } from './vending-machine/message.dto';
import { VendingMachineFactory } from './vending-machine/vending-machine.factory';
import { VendingMachine } from './vending-machine/vending-machine.interface';

class App {
  private readonly logger: Logger;
  private readonly machine: VendingMachine;
  private readonly api: Api;

  private readonly linkId = Config.pos.name;

  constructor() {
    this.logger = new Logger('Vending Machine');
    this.api = new Api();
    this.machine = VendingMachineFactory.create(Config.pos.bus, Config.pos.adapter);
  }

  async run() {
    // create the link
    const link = await this.api.getPaymentLink(this.linkId).catch(() => undefined);
    if (!link) await this.api.createPaymentLink(this.linkId);

    // listen to messages
    this.machine.onMessage.subscribe(async (msg: Message) => {
      try {
        switch (msg.type) {
          case MessageType.PRODUCT:
            this.logger.debug(`Received product from machine: ${msg.payload.product}`);
            await this.onProduct(msg);
            break;

          case MessageType.ERROR:
            this.logger.error(`Received error from machine: ${msg.payload}`);
            break;
        }
      } catch (e) {
        this.logger.error('Failed to handle message:', e);
      }
    });

    // enable
    await this.machine.enable();

    // wait forever
    for (;;) {
      await Util.sleep(1);
      // await this.machine.refreshCredit();
    }
  }

  private async onProduct(msg: ProductMessage) {
    await this.api.cancelPayment(this.linkId).catch(() => {
      // ignore error
    });

    const date = new Date().toISOString().split('.')[0].split(':').join('').split('-').join('').split('T').join('-');
    const id = `${msg.payload.product}-${date}`;
    let { payment } = await this.api.createPayment(
      this.linkId,
      msg.payload.price,
      Config.pos.currency,
      id,
      Util.secondsAfter(Config.pos.timeout),
    );
    if (!payment) return;

    const paymentId = payment.id;

    // poll the payment
    while (payment?.status === PaymentLinkPaymentStatus.PENDING && payment.id === paymentId) {
      ({ payment } = await this.api.waitForPayment(this.linkId));
    }

    if (payment?.id === paymentId) {
      switch (payment.status) {
        case PaymentLinkPaymentStatus.COMPLETED:
          await this.machine.acceptVend(msg.payload.price);
          this.logger.debug(`Payment ${paymentId} completed`);
          break;

        case PaymentLinkPaymentStatus.EXPIRED:
          await this.machine.stopVend();
          this.logger.debug(`Payment ${paymentId} expired`);
          break;
      }
    }
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
