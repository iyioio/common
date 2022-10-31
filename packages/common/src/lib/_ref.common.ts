import { HashMap } from "./common-types";
import { IConfig } from "./config";
import { createTypeRef } from "./TypeRef";

export const IConfigRef=createTypeRef<IConfig|HashMap>('IConfig');
