export interface Logger {
  info(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

export class ConsoleLogger implements Logger {
  constructor(private readonly scope: string) {}

  info(message: string, data: Record<string, unknown> = {}): void {
    console.log(JSON.stringify({ level: "info", scope: this.scope, message, ...data }));
  }

  error(message: string, data: Record<string, unknown> = {}): void {
    console.error(JSON.stringify({ level: "error", scope: this.scope, message, ...data }));
  }
}
