import { defineBoolParam, defineStringParam } from "@iyio/common";

export const cognitoIdentityPoolIdParam=defineStringParam('cognitoIdentityPoolId');
export const cognitoUserPoolClientIdParam=defineStringParam('cognitoUserPoolClientId');
export const cognitoUserPoolIdParam=defineStringParam('cognitoUserPoolId');
export const cognitoDomainPrefixParam=defineStringParam('cognitoDomainPrefix');
export const disableCognitoUnauthenticatedParam=defineBoolParam('disableCognitoUnauthenticated');
/**
 * Redirect path to a page to handle an oauth code. Can be a full URL or a path. If is a path the
 * current host and protocol will be used.
 * @default '/oauth'
 */
export const cognitoOAuthRedirectUriParam=defineStringParam('cognitoOAuthRedirectUri','/oauth');

export const cognitoOAuthScopesParams=defineStringParam('cognitoOAuthScopes','aws.cognito.signin.user.admin,email,openid,profile')
