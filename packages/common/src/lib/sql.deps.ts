import { defineClient } from "./scope-lib";
import { ISqlClient } from "./sql-types";

// SQL
export const sqlClient=defineClient<ISqlClient>('sqlClient');
