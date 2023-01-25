import { defineBoolParam, defineStringParam } from "@iyio/common";

export const cognitoIdentityPoolIdParam=defineStringParam('cognitoIdentityPoolId');
export const cognitoUserPoolClientIdParam=defineStringParam('cognitoUserPoolClientId');
export const cognitoUserPoolIdParam=defineStringParam('cognitoUserPoolId');
export const disableCognitoUnauthenticatedParam=defineBoolParam('disableCognitoUnauthenticated');
