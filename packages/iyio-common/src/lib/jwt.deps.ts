import type { JwtProvider, JwtValidator } from "./jwt";
import { defineProvider } from "./scope-lib";

export const JwtProviders=defineProvider<JwtProvider>('JwtProviders');

export const JwtValidators=defineProvider<JwtValidator>('JwtValidators');
