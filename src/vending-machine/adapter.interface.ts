export interface Adapter {
  onRead(cb: (data: string[]) => void): void;
  onWrite(data: string): boolean;
}
