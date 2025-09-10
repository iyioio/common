import { IQueryClient } from "./query-types.js";
import { defineClient } from "./scope-lib.js";

export const queryClient=defineClient<IQueryClient>("queryClient");
