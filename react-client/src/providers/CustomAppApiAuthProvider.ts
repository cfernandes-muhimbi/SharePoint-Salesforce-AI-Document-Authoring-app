
import * as Msal from '@azure/msal-browser';
import * as Scopes from '../common/Scopes';
import msalClient, { waitForMsalReady } from './MsalClient';

export class CustomAppApiAuthProvider {

    public readonly client = msalClient;
    public static readonly instance: CustomAppApiAuthProvider = new CustomAppApiAuthProvider();
    
    private constructor() {}

    public async getToken(scopes: string[] = [Scopes.SAMPLE_API_CONTAINER_MANAGE]): Promise<string> {
        await waitForMsalReady();
        const tokenRequest: Msal.SilentRequest = {
            scopes: scopes,
            prompt: 'select_account',
            redirectUri: window.location.origin,
        };
        let account = this.client.getActiveAccount();
        try {
            if (account) {
                tokenRequest.account = account;
                const result = await this.client.acquireTokenSilent(tokenRequest);
                return result.accessToken;
            }
            throw new Msal.InteractionRequiredAuthError();
        } catch (error) {
            if (error instanceof Msal.InteractionRequiredAuthError) {
                const result = await this.client.acquireTokenPopup({
                    scopes: scopes,
                    redirectUri: window.location.origin,
                });
                this.client.setActiveAccount(result.account);
                return result.accessToken;
            } else {
                throw error;
            }
        }
    }
}
