import { IQueryClient } from "./query-types";
import { defineClient } from "./scope-lib";

export const queryClient=defineClient<IQueryClient>("queryClient");
