export interface Logger {
  info(message: string, fields?: Record<string, unknown>): void;
  warn(message: string, fields?: Record<string, unknown>): void;
  error(message: string, fields?: Record<string, unknown>): void;
}

export class ConsoleLogger implements Logger {
  constructor(private readonly component: string) {}

  info(message: string, fields: Record<string, unknown> = {}): void {
    console.log(JSON.stringify({ level: "info", component: this.component, message, ...fields }));
  }

  warn(message: string, fields: Record<string, unknown> = {}): void {
    console.warn(JSON.stringify({ level: "warn", component: this.component, message, ...fields }));
  }

  error(message: string, fields: Record<string, unknown> = {}): void {
    console.error(JSON.stringify({ level: "error", component: this.component, message, ...fields }));
  }
}
