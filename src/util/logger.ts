import { appendFileSync } from 'fs';
import Config from '../config';

export enum LogLevel {
  DEBUG,
  INFO,
  WARNING,
  ERROR,
}

export class Logger {
  constructor(
    private readonly name: string,
    private readonly level = LogLevel.DEBUG,
  ) {}

  debug(message: string, payload?: unknown): void {
    if (this.level <= LogLevel.DEBUG) this.log(LogLevel.DEBUG, message, payload);
  }

  info(message: string, payload?: unknown): void {
    if (this.level <= LogLevel.INFO) this.log(LogLevel.INFO, message, payload);
  }

  warning(message: string, payload?: unknown): void {
    if (this.level <= LogLevel.WARNING) this.log(LogLevel.WARNING, message, payload);
  }

  error(message: string, payload?: unknown): void {
    if (this.level <= LogLevel.ERROR) this.log(LogLevel.ERROR, message, payload);
  }

  private log(level: LogLevel, message: string, payload: unknown) {
    const logMethod = this.getLogMethod(level);
    Config.logger.printConsole && logMethod(`[${this.name}] ${message}`, payload ? payload : '');

    Config.logger.printFile &&
      appendFileSync(
        Config.logger.filePath,
        this.getMessage(level, message) + (payload ? ` ${this.payloadToString(payload)}` : '') + '\n',
      );
  }

  private getLogMethod(level: LogLevel): (...data: unknown[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARNING:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
    }
  }

  private getMessage(level: LogLevel, message: string): string {
    return `${new Date().toLocaleString()} - ${LogLevel[level]} - [${this.name}] ${message}`;
  }

  private payloadToString(payload: unknown): string | undefined {
    if (typeof payload === 'string') {
      return payload;
    }
    if (payload instanceof Error) {
      return payload.stack ?? `${payload.name}: ${payload.message}`;
    }

    return JSON.stringify(payload);
  }
}
