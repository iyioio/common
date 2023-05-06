import { FnEventTransformer } from "./fn-handler-types";
import { defineProvider } from "./scope-lib";

export const FnEventTransformers=defineProvider<FnEventTransformer>('FnEventTransformers');
