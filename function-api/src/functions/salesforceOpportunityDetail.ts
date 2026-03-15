import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import axios from "axios";

interface SalesforceTokenResponse {
    access_token: string;
    instance_url: string;
}

interface ContactRole {
    Contact: {
        Id: string;
        Name: string;
        Email: string | null;
        Phone: string | null;
        Title: string | null;
    };
    Role: string | null;
    IsPrimary: boolean;
}

interface AccountContact {
    Id: string;
    Name: string;
    Email: string | null;
    Phone: string | null;
    Title: string | null;
}

interface OpportunityDetail {
    Id: string;
    AccountId: string | null;
    Name: string;
    StageName: string;
    Amount: number;
    CloseDate: string;
    Description: string | null;
    Probability: number | null;
    Type: string | null;
    LeadSource: string | null;
    Account: { Name: string } | null;
    Owner: { Name: string; Email: string } | null;
    OpportunityContactRoles: { records: ContactRole[] } | null;
}

async function getSalesforceToken(): Promise<SalesforceTokenResponse> {
    const clientId = process.env.SF_CLIENT_ID;
    const clientSecret = process.env.SF_CLIENT_SECRET;
    const loginUrl = process.env.SF_LOGIN_URL ?? "https://orgfarm-277029e6b1-dev-ed.develop.my.salesforce.com";

    if (!clientId || !clientSecret) {
        throw new Error("Missing Salesforce credentials.");
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

export async function salesforceOpportunityDetail(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    const id = request.params.id;
    if (!id) {
        return { status: 400, body: "Opportunity ID is required." };
    }

    try {
        const { access_token, instance_url } = await getSalesforceToken();
        const authHeader = { Authorization: `Bearer ${access_token}` };

        // Query 1: Opportunity + OpportunityContactRoles
        const oppQuery = `
            SELECT Id, AccountId, Name, StageName, Amount, CloseDate,
                   Description, Probability, Type, LeadSource,
                   Account.Name,
                   Owner.Name, Owner.Email,
                   (SELECT Contact.Id, Contact.Name, Contact.Email,
                           Contact.Phone, Contact.Title, Role, IsPrimary
                    FROM OpportunityContactRoles)
            FROM Opportunity
            WHERE Id = '${id}'
        `;

        const oppResponse = await axios.get<{ records: OpportunityDetail[] }>(
            `${instance_url}/services/data/v59.0/query`,
            { params: { q: oppQuery }, headers: authHeader }
        );

        if (!oppResponse.data.records.length) {
            return { status: 404, body: `Opportunity ${id} not found.` };
        }

        const opp = oppResponse.data.records[0];

        // Query 2: Contacts from the related Account (fallback when no OpportunityContactRoles)
        let accountContacts: AccountContact[] = [];
        if (opp.AccountId) {
            const contactQuery = `
                SELECT Id, Name, Email, Phone, Title
                FROM Contact
                WHERE AccountId = '${opp.AccountId}'
                ORDER BY Name ASC
            `;
            const contactResponse = await axios.get<{ records: AccountContact[] }>(
                `${instance_url}/services/data/v59.0/query`,
                { params: { q: contactQuery }, headers: authHeader }
            );
            accountContacts = contactResponse.data.records;
        }

        return {
            jsonBody: {
                ...opp,
                accountContacts,
            }
        };

    } catch (error: any) {
        const sfError = error.response?.data;
        const message = sfError
            ? `Salesforce error [${sfError.error}]: ${sfError.error_description}`
            : error.message;
        context.error("Opportunity detail error:", message);
        return { status: error.response?.status ?? 500, jsonBody: { error: message } };
    }
}

app.http("salesforceOpportunityDetail", {
    methods: ["GET"],
    authLevel: "anonymous",
    route: "salesforce/opportunities/{id}",
    handler: salesforceOpportunityDetail,
});
