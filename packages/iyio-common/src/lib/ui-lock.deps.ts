import { defineService } from "./scope-lib.js";
import { createUiLockContainer } from "./ui-lock-lib.js";
import { UiLockContainer } from "./ui-lock-types.js";

export const uiLockContainerService=defineService<UiLockContainer>('uiLockContainerService',()=>createUiLockContainer());
