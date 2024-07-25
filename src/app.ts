import { exit } from 'process';
import { Api } from './adapters/api/api';
import { PaymentLinkPaymentStatus } from './adapters/api/dto';
import { Message, MessageType, VendingMachine } from './adapters/vending-machine';
import Config from './config';
import { Logger } from './util/logger';
import { Util } from './util/util';

class App {
  private readonly logger: Logger;
  private readonly machine: VendingMachine;
  private readonly api: Api;

  constructor() {
    this.logger = new Logger('Vending Machine');
    this.api = new Api();
    this.machine = new VendingMachine();
  }

  async run() {
    const linkId = Config.deviceId;

    // create the link
    const link = await this.api.getPaymentLink(linkId).catch(() => undefined);
    if (!link) await this.api.createPaymentLink(linkId);

    // listen to messages
    this.machine.onMessage.subscribe(async (msg: Message) => {
      switch (msg.type) {
        case MessageType.ENABLED: {
          await this.machine.setCredit(10);
          break;
        }

        case MessageType.PRODUCT: {
          await this.api.cancelPayment(linkId).catch(() => {
            // ignore error
          });

          let { payment } = await this.api.createPayment(
            linkId,
            msg.payload.price,
            'CHF',
            undefined,
            Util.minutesAfter(10),
          ); // TODO: machine timeout?
          if (!payment) return;

          const paymentId = payment.id;

          // poll the payment
          while (payment?.status === PaymentLinkPaymentStatus.PENDING && payment.id === paymentId) {
            Util.sleep(1);

            ({ payment } = await this.api.getPaymentLink(linkId));
          }

          if (payment?.id === paymentId) {
            switch (payment.status) {
              case PaymentLinkPaymentStatus.COMPLETED:
                // TODO: accept vend
                break;

              case PaymentLinkPaymentStatus.EXPIRED:
                // TODO: cancel vend
                break;
            }
          }
          break;
        }

        // // cancel the payment
        // link = await this.api.cancelPayment(link.id);
        // this.logger.info('Link:', link);

        case MessageType.ERROR: {
          this.logger.error(`Received error from machine: ${msg.payload}`);
          break;
        }
      }
    });

    // enable
    await this.machine.enable();

    // wait forever
    for (;;) {
      Util.sleep(1);
    }
  }
}

new App()
  .run()
  .catch(console.error)
  .finally(() => exit());
