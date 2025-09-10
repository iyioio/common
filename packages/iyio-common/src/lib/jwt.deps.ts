import type { JwtProvider, JwtValidator } from "./jwt.js";
import { defineProvider } from "./scope-lib.js";

export const JwtProviders=defineProvider<JwtProvider>('JwtProviders');

export const JwtValidators=defineProvider<JwtValidator>('JwtValidators');
