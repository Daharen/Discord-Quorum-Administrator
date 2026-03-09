declare const Buffer: {
  from(input: string, encoding?: string): any;
};

declare module "node:crypto" {
  export type KeyObject = any;
  export function createHash(algorithm: string): {
    update(data: string, inputEncoding?: string): { digest(encoding: string): string };
    digest(encoding: string): string;
  };
  export function randomBytes(size: number): { toString(encoding: string): string };
  export function generateKeyPairSync(type: "ed25519"): {
    publicKey: KeyObject;
    privateKey: KeyObject;
  };
  export function sign(
    algorithm: null,
    data: any,
    key: KeyObject,
  ): { toString(encoding: string): string };
  export function verify(
    algorithm: null,
    data: any,
    key: KeyObject,
    signature: any,
  ): boolean;
  export function createPublicKey(options: {
    key: any;
    format: "der";
    type: "spki";
  }): KeyObject;
}

declare module "node:test" {
  const test: (name: string, fn: () => void | Promise<void>) => void;
  export default test;
}

declare module "node:assert/strict" {
  const assert: {
    equal(actual: unknown, expected: unknown): void;
  };
  export default assert;
}
