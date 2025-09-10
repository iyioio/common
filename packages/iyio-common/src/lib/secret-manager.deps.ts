import { defineService } from "./scope-lib.js";
import { SecretManager } from "./secret-manager.js";

export const secretManager=defineService<SecretManager>('secretManager');
