import { defineStringParam } from "./scope-lib";

export const paramsCheckParam=defineStringParam('paramsCheck');
export const appNameParam=defineStringParam('appName','App');
export const appLongNameParam=defineStringParam('appLongName','App Long');
export const frontendDomainParam=defineStringParam('frontendDomain',globalThis.window?.location?.host??'localhost');
export const shareDomainParam=defineStringParam('shareDomain');
