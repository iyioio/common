import { CryptoMethods } from "./crypto-bytes-types.js";
import { defineProvider } from "./scope-lib.js";

export const CryptoMethodsProvider=defineProvider<CryptoMethods>('CryptoMethods');
