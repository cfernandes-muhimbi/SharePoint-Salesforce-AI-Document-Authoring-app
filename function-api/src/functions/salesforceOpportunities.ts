import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import axios from "axios";

interface SalesforceTokenResponse {
    access_token: string;
    instance_url: string;
}

interface SalesforceRecord {
    Id: string;
    Name: string;
    StageName: string;
    Amount: number;
    CloseDate: string;
    Account: { Name: string } | null;
    Owner: { Name: string } | null;
}

interface SalesforceQueryResponse {
    totalSize: number;
    done: boolean;
    nextRecordsUrl?: string;
    records: SalesforceRecord[];
}

async function getSalesforceToken(): Promise<SalesforceTokenResponse> {
    const clientId = process.env.SF_CLIENT_ID;
    const clientSecret = process.env.SF_CLIENT_SECRET;
    const loginUrl = process.env.SF_LOGIN_URL ?? "https://orgfarm-277029e6b1-dev-ed.develop.my.salesforce.com";

    if (!clientId || !clientSecret) {
        throw new Error("Missing Salesforce credentials: SF_CLIENT_ID and SF_CLIENT_SECRET must be set.");
    }

    const tokenResponse = await axios.post<SalesforceTokenResponse>(
        `${loginUrl}/services/oauth2/token`,
        new URLSearchParams({
            grant_type: "client_credentials",
            client_id: clientId,
            client_secret: clientSecret,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    return tokenResponse.data;
}

export async function salesforceOpportunities(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    try {
        const { access_token, instance_url } = await getSalesforceToken();

        const query = `
            SELECT Id, Name, StageName, Amount, CloseDate,
                   Account.Name, Owner.Name
            FROM Opportunity
            ORDER BY Name ASC
        `;

        const authHeader = { Authorization: `Bearer ${access_token}` };
        const allRecords: SalesforceRecord[] = [];

        // Fetch first page
        let response = await axios.get<SalesforceQueryResponse>(
            `${instance_url}/services/data/v59.0/query`,
            { params: { q: query }, headers: authHeader }
        );
        allRecords.push(...response.data.records);

        // Follow pagination until done
        while (!response.data.done && response.data.nextRecordsUrl) {
            response = await axios.get<SalesforceQueryResponse>(
                `${instance_url}${response.data.nextRecordsUrl}`,
                { headers: authHeader }
            );
            allRecords.push(...response.data.records);
        }

        context.log(`Fetched ${allRecords.length} of ${response.data.totalSize} opportunities`);
        return { jsonBody: allRecords };

    } catch (error: any) {
        const sfError = error.response?.data;
        const status = error.response?.status ?? 500;
        const message = sfError
            ? `Salesforce error [${sfError.error}]: ${sfError.error_description}`
            : error.message;
        context.error("Salesforce opportunities error:", message);
        return { status, jsonBody: { error: sfError?.error ?? "unknown", message } };
    }
}

app.http("salesforceOpportunities", {
    methods: ["GET"],
    authLevel: "anonymous",
    route: "salesforce/opportunities",
    handler: salesforceOpportunities,
});
