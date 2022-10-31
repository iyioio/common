import { AuthDeleteResult, AuthRegisterResult, AuthSignInResult, IAuthProvider, User, UserAuthProviderData } from '@iyio/app-common';

export class CognitoAuthProvider implements IAuthProvider
{
    public readonly type='CognitoAuthProvider';

    public async getUserAsync(data: UserAuthProviderData): Promise<User | null> {
        return null;
    }
    public async deleteAsync(user: User): Promise<AuthDeleteResult | undefined> {
        return undefined;
    }
    public async signOutAsync(user: User): Promise<void> {
        //
    }
    public async signInEmailPasswordAsync?(email: string, password: string): Promise<AuthSignInResult | undefined> {
        return undefined
    }
    public async registerEmailPasswordAsync?(email: string, password: string): Promise<AuthRegisterResult | undefined> {
        return undefined
    }

}
