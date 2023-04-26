import { defineService } from "./scope-lib";
import { createUiLockContainer } from "./ui-lock-lib";
import { UiLockContainer } from "./ui-lock-types";

export const uiLockContainerService=defineService<UiLockContainer>('uiLockContainerService',()=>createUiLockContainer());
