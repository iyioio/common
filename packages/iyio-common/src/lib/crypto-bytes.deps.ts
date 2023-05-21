import { CryptoMethods } from "./crypto-bytes-types";
import { defineProvider } from "./scope-lib";

export const CryptoMethodsProvider=defineProvider<CryptoMethods>('CryptoMethods');
