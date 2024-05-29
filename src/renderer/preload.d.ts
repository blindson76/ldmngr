import { ServiceHandler } from '../main/preload';

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    service: ServiceHandler
  }
}

export {};
