export interface ISalesforceContactRole {
    Role: string | null;
    IsPrimary: boolean;
    Contact: {
        Id: string;
        Name: string;
        Email: string | null;
        Phone: string | null;
        Title: string | null;
    };
}

export interface ISalesforceOpportunity {
    Id: string;
    Name: string;
    StageName: string;
    Amount: number;
    CloseDate: string;
    Account: { Name: string } | null;
    Owner: { Name: string } | null;
}

export interface ISalesforceAccountContact {
    Id: string;
    Name: string;
    Email: string | null;
    Phone: string | null;
    Title: string | null;
}

export interface ISalesforceOpportunityDetail extends ISalesforceOpportunity {
    Description: string | null;
    Probability: number | null;
    Type: string | null;
    LeadSource: string | null;
    Owner: { Name: string; Email: string } | null;
    OpportunityContactRoles: { records: ISalesforceContactRole[] } | null;
    accountContacts: ISalesforceAccountContact[];
}

export class SalesforceApiProvider {
    public readonly apiUrl: string =
        process.env.REACT_APP_SAMPLE_API_URL || 'http://localhost:7072/api';

    public static readonly instance = new SalesforceApiProvider();
    private constructor() {}

    public async listOpportunities(): Promise<ISalesforceOpportunity[]> {
        const response = await fetch(`${this.apiUrl}/salesforce/opportunities`);
        if (!response.ok) throw new Error(`Failed to fetch opportunities: ${response.statusText}`);
        return response.json();
    }

    public async getOpportunity(id: string): Promise<ISalesforceOpportunityDetail> {
        const response = await fetch(`${this.apiUrl}/salesforce/opportunities/${id}`);
        if (!response.ok) throw new Error(`Failed to fetch opportunity: ${response.statusText}`);
        return response.json();
    }
}
