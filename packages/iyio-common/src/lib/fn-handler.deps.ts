import { FnEventTransformer } from "./fn-handler-types.js";
import { defineProvider } from "./scope-lib.js";

export const FnEventTransformers=defineProvider<FnEventTransformer>('FnEventTransformers');
