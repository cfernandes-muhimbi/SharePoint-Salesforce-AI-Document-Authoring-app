
import * as Msal from '@azure/msal-browser';
import * as Scopes from '../common/Scopes';
import msalClient, { waitForMsalReady } from './MsalClient';

export class GraphAuthProvider {

    public readonly _client = msalClient;
    public static readonly instance: GraphAuthProvider = new GraphAuthProvider();
    private _interactionInProgress: boolean = false;

    private constructor() {}

    private async _getTokenSilent(scopes: string[]): Promise<string> {
        const silentRequest: Msal.SilentRequest = {
            scopes: scopes,
            account: this.account!
        };
        const result = await this._client.acquireTokenSilent(silentRequest);
        this._client.setActiveAccount(result.account);
        return result.accessToken;
    }

    private async _getTokenPopup(scopes: string[]): Promise<string> {
        if (this._interactionInProgress) {
            throw new Error('An interactive authentication request is already in progress');
        }
        this._interactionInProgress = true;
        try {
            const tokenRequest: Msal.PopupRequest = {
                scopes: scopes
            };
            const result = await this._client.acquireTokenPopup(tokenRequest);
            this._client.setActiveAccount(result.account);
            return result.accessToken;
        } finally {
            this._interactionInProgress = false;
        }
    }

    public async getToken(scopes: string[] = Scopes.GRAPH_SCOPES): Promise<string> { 
        console.log(this.account);
        try {
            await waitForMsalReady();
            if (this.account) {
                return await this._getTokenSilent(scopes);
            }
            return await this._getTokenPopup(scopes);
        } catch (error) {
            if (error instanceof Msal.InteractionRequiredAuthError) {
                return await this._getTokenPopup(scopes);
            } else {
                throw error;
            }
        }
    }

    public async signIn(scopes: string[] = Scopes.GRAPH_SCOPES): Promise<Msal.AccountInfo | null> {
        return this.getToken(scopes).then(() => this.account).catch(() => null);
    }

    public get account(): Msal.AccountInfo | null {
        return this._client.getActiveAccount();
    }

    public async isSignedIn(): Promise<boolean> {
        return this.account !== null;
    }
}
