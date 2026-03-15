
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import msalClient, { waitForMsalReady } from './MsalClient';
import { GraphProvider } from './GraphProvider';

export class ChatAuthProvider {

    private static _instance?: ChatAuthProvider;
    private _client = msalClient;
    private _interactionInProgress: boolean = false;
    
    public static async getInstance(): Promise<ChatAuthProvider> {
        if (!ChatAuthProvider._instance) {
            const spHostname = await GraphProvider.instance.getSpUrl();
            ChatAuthProvider._instance = new ChatAuthProvider(spHostname);
            await waitForMsalReady();
        }
        return ChatAuthProvider._instance;
    }

    private constructor(public readonly hostname: string) {}
    
    public get scopes(): string[] {
        return [
            `${this.hostname}/Container.Selected`
        ];
    }
    
    public async login(): Promise<void> {
        if (this._interactionInProgress) {
            return;
        }
        this._interactionInProgress = true;
        try {
            await this._client.loginPopup({
                scopes: this.scopes,
                prompt: 'select_account',
            });
        } finally {
            this._interactionInProgress = false;
        }
    }

    public async getToken(): Promise<string> {
        try {
            if (!this._client.getActiveAccount()) {
                throw new InteractionRequiredAuthError('no_account', 'No account is signed in');
            }
            const response = await this._client.acquireTokenSilent({
                scopes: this.scopes
            });
            return response.accessToken;
        } catch (error) {
            if (error instanceof InteractionRequiredAuthError) {
                if (this._interactionInProgress) {
                    throw new Error('An interactive authentication request is already in progress');
                }
                this._interactionInProgress = true;
                try {
                    const response = await this._client.acquireTokenPopup({
                        scopes: this.scopes
                    });
                    return response.accessToken;
                } finally {
                    this._interactionInProgress = false;
                }
            }
            throw error;
        }
    }
}