import { Adapter } from './adapter.interface';
import { AbrantixRpiAdapter } from './implementations/abrantix-rpi.adapter';
import { DummyAdapter } from './implementations/dummy.adapter';
import { MdbLevel2 } from './implementations/mdb-level2';
import { QibixxUsbAdapter } from './implementations/qibixx-usb.adapter';
import { VendingMachine } from './vending-machine.interface';

export enum BusType {
  MDB_LEVEL_2 = 'MDB_Level_2',
}

export enum AdapterType {
  DUMMY = 'Dummy',
  QIBIXX_USB = 'Qibixx_USB',
  ABRANTIX_RPI = 'Abrantix_RPI',
}

export class VendingMachineFactory {
  static create(busType: BusType, adapterType: AdapterType): VendingMachine {
    const adapter = this.createAdapter(adapterType);

    switch (busType) {
      case BusType.MDB_LEVEL_2:
        return new MdbLevel2(adapter);
    }

    throw new Error(`Invalid buy type ${busType}`);
  }

  private static createAdapter(adapter: AdapterType): Adapter {
    switch (adapter) {
      case AdapterType.DUMMY:
        return new DummyAdapter();

      case AdapterType.QIBIXX_USB:
        return new QibixxUsbAdapter();

      case AdapterType.ABRANTIX_RPI:
        return new AbrantixRpiAdapter();
    }

    throw new Error(`Invalid adapter type ${adapter}`);
  }
}
