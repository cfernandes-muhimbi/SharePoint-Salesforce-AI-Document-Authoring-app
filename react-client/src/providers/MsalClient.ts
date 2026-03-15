import { PublicClientApplication, Configuration } from '@azure/msal-browser';
import { Providers, ProviderState } from '@microsoft/mgt-element';
import * as Constants from '../common/Constants';

const msalConfig: Configuration = {
    auth: {
        clientId: Constants.AZURE_CLIENT_ID!,
        authority: Constants.AUTH_AUTHORITY,
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: true
    }
};

// Shared MSAL v3 PCA for CustomAppApiAuthProvider, GraphAuthProvider, ChatAuthProvider.
// Msal2Provider uses its own internal MSAL v2 PCA (same clientId, shared localStorage).
// We must wait for Msal2Provider to finish redirect handling before initializing this PCA,
// otherwise both PCAs race on the interaction_in_progress flag in localStorage.
const msalClient = new PublicClientApplication(msalConfig);

let initPromise: Promise<void> | null = null;

/**
 * Wait for Msal2Provider to finish initialization, then initialize our v3 PCA.
 * This prevents both PCAs from calling handleRedirectPromise() simultaneously.
 */
export async function waitForMsalReady(): Promise<void> {
    if (!initPromise) {
        initPromise = (async () => {
            // First, wait for Msal2Provider (v2) to finish its redirect handling
            await waitForProviderReady();
            // Now safe to initialize our v3 PCA
            await msalClient.initialize();
            // handleRedirectPromise on our v3 PCA to clear any stale state
            // At this point Msal2Provider has already consumed the redirect,
            // so this will just return null and clear interaction_in_progress if stuck
            await msalClient.handleRedirectPromise().catch(() => {});
            // Sync the active account from localStorage. Msal2Provider (v2) stored
            // login info in localStorage, and v3 PCA can read it via getAllAccounts(),
            // but setActiveAccount() is per-instance, so we must set it here.
            if (!msalClient.getActiveAccount()) {
                const accounts = msalClient.getAllAccounts();
                if (accounts.length > 0) {
                    msalClient.setActiveAccount(accounts[0]);
                }
            }
        })();
    }
    await initPromise;
}

function waitForProviderReady(): Promise<void> {
    const state = Providers.globalProvider?.state;
    if (state === ProviderState.SignedIn || state === ProviderState.SignedOut) {
        return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
        const handler = () => {
            const s = Providers.globalProvider?.state;
            if (s === ProviderState.SignedIn || s === ProviderState.SignedOut) {
                Providers.globalProvider.removeStateChangedHandler(handler);
                resolve();
            }
        };
        Providers.globalProvider?.onStateChanged(handler);
    });
}

export default msalClient;
