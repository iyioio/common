import { defineService } from "./scope-lib";
import { SecretManager } from "./secret-manager";

export const secretManager=defineService<SecretManager>('secretManager');
