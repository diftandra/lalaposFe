// Type declarations for qz-tray
declare module 'qz-tray' {
  export const websocket: {
    connect: (config?: { retries?: number; delay?: number }) => Promise<void>;
    disconnect: () => Promise<void>;
    isActive: () => boolean;
  };

  export const printers: {
    find: () => Promise<string[]>;
    getDefault: () => Promise<string>;
  };

  export const configs: {
    create: (printer: string) => any;
  };

  export const print: (config: any, data: string[]) => Promise<void>;

  export const security: {
    setCertificatePromise: (func: (resolve: any, reject: any) => void) => void;
    setSignatureAlgorithm: (algorithm: string) => void;
    setSignaturePromise: (func: (toSign: string) => (resolve: any, reject: any) => void) => void;
  };
}
