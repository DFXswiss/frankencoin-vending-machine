import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';

type KeyType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export class Util {
  static poll<T>(
    action: () => Promise<T | undefined>,
    verify: (result: T | undefined) => boolean,
    interval: number,
    timeout: number,
    catchErrors?: boolean,
  ): Promise<T | undefined> {
    return new Promise((resolve) => this.doPoll(action, verify, interval, timeout, catchErrors).then(resolve));
  }

  private static async doPoll<T>(
    action: () => Promise<T | undefined>,
    verify: (result: T | undefined) => boolean,
    interval: number,
    timeout: number,
    catchErrors?: boolean,
  ): Promise<T | undefined> {
    let abort = false;

    // action/error handling
    const doAction = async () =>
      await action().catch((e) => {
        if (catchErrors) return undefined;

        abort = true;
        throw e;
      });

    // set timer
    const timer = setTimeout(() => (abort = true), timeout * 1000);

    // poll
    let result = await doAction();
    while (!abort && !verify(result)) {
      await this.sleep(interval);
      result = await doAction();
    }

    clearTimeout(timer);
    return result;
  }

  static async retry<T>(action: () => Promise<T>, tryCount = 3, delay = 0): Promise<T> {
    try {
      return await action();
    } catch (e) {
      if (tryCount > 1) {
        await this.sleep(delay);
        return this.retry(action, tryCount - 1, delay);
      }

      throw e;
    }
  }

  // --- TIME UTIL --- //
  static sleep(seconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }

  static minutesAfter(minutes: number, from?: Date): Date {
    const date = from ? new Date(from) : new Date();
    date.setMinutes(date.getMinutes() + minutes);
    return date;
  }

  static minutesBefore(minutes: number, from?: Date): Date {
    return this.minutesAfter(-minutes, from);
  }

  static secondsAfter(seconds: number, from?: Date): Date {
    const date = from ? new Date(from) : new Date();
    date.setSeconds(date.getSeconds() + seconds);
    return date;
  }

  static secondsBefore(seconds: number, from?: Date): Date {
    return this.secondsAfter(-seconds, from);
  }

  // --- MATH UTIL --- //
  static round(number: number, decimals: number): number {
    return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  static sum(list: number[]): number {
    return list.reduce((prev, curr) => prev + curr, 0);
  }

  static sumObj<T>(list: T[], key: KeyType<T, number>): number {
    return this.sum(list.map((i) => i[key] as unknown as number));
  }

  static avg(list: number[]): number {
    return this.sum(list) / list.length;
  }

  // --- FILE UTIL --- //
  static ensureDir(filePath: string) {
    const dir = dirname(filePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  static readFile<T>(fileName: string): T {
    return JSON.parse(this.readFileRaw(fileName));
  }

  static readFileRaw(fileName: string): string {
    return readFileSync(fileName).toString();
  }

  static writeFile<T>(fileName: string, content: T) {
    this.writeFileRaw(fileName, JSON.stringify(content));
  }

  static writeFileRaw(fileName: string, content: string) {
    writeFileSync(fileName, content);
  }

  static appendFile<T>(fileName: string, content: T) {
    this.appendFileRaw(fileName, JSON.stringify(content));
  }

  static appendFileRaw(fileName: string, content: string) {
    appendFileSync(fileName, content);
  }
}
