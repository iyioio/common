import { DisposeCallback } from "@iyio/common";
import { HookCtrl } from "./HookCtrl.js";

export type HookCallback=(state:Record<string,any>,ctrl:HookCtrl)=>void;

export type HookCallbackWithCleanup=(state:Record<string,any>,ctrl:HookCtrl)=>void|DisposeCallback;
