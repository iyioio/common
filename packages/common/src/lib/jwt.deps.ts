import type { JwtProvider } from "./jwt";
import { defineProvider } from "./scope-lib";

export const JwtProviders=defineProvider<JwtProvider>('JwtProviders');
