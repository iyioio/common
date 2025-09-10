import { defineClient } from "./scope-lib.js";
import { ISqlClient } from "./sql-types.js";

// SQL
export const sqlClient=defineClient<ISqlClient>('sqlClient');
