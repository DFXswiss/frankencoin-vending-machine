import { SerialPort } from 'serialport';

export class VendingMachine {
  async listPorts(): Promise<object[]> {
    return SerialPort.list();
  }
}
