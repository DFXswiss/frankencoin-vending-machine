import { DummyMachine } from './implementations/dummy-machine';
import { MdbLevel2 } from './implementations/mdb-level2';
import { VendingMachine } from './vending-machine';

export enum BusType {
  MDB_LEVEL_2 = 'MdbLevel2',
}

export enum AdapterType {
  DUMMY = 'Dummy',
  QIBIXX_USB = 'Qibixx_USB',
  ABRANTIX_RPI = 'Abrantix_RPI',
}

export class VendingMachineFactory {
  static create(bus: BusType, adapter: AdapterType): VendingMachine {
    switch (bus) {
      case BusType.MDB_LEVEL_2: {
        switch (adapter) {
          case AdapterType.DUMMY:
            return new DummyMachine();

          case AdapterType.QIBIXX_USB:
            return new MdbLevel2();
        }
        break;
      }
    }

    throw new Error(`Invalid machine type ${adapter}`);
  }
}
