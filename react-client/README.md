# AI Document Authoring

A React + TypeScript app for AI-powered document generation using SharePoint Embedded, Salesforce CRM, and Microsoft Graph.

## What it does

- Browse Salesforce opportunities and generate professional documents from templates
- Multi-step wizard: select template → customise → review CRM data → preview → download
- **Quick AI Templates** — select an opportunity and generate a document in one click
- Uploads generated DOCX files to a SharePoint Embedded container
- Sends document review requests via Microsoft Teams Adaptive Cards

## Tech stack

- React + TypeScript (Create React App)
- Microsoft Graph Toolkit (MGT) for auth and people picker
- SharePoint Embedded for file storage
- Nutrient Document Authoring SDK for DOCX preview and editing
- docxtemplater + PizZip for template population
- Azure Functions backend for Salesforce integration

## Getting started

### Prerequisites

- Node.js 18+
- An Azure AD app registration with the required Graph permissions
- A SharePoint Embedded container type and two containers (templates + output)
- A Salesforce connected app (via the Azure Functions backend)

### Environment variables

Create a `.env` file in `react-client/`:

```
REACT_APP_AZURE_APP_ID=<your Azure AD client ID>
REACT_APP_AZURE_SERVER_APP_ID=<your server app ID>
REACT_APP_TENANT_ID=<your tenant ID>
REACT_APP_SPE_CONTAINER_TYPE_ID=<container type ID>
REACT_APP_TEMPLATE_CONTAINER_ID=<ID of the container holding templates>
REACT_APP_SP_ROOT_SITE_URL=<your SharePoint root URL>
```

### Run locally

```bash
npm install
npm start
```

App runs at `http://localhost:3000`.

### Templates

Upload `invoice_template_with_terms.docx` and `msa_template.docx` to your template SPE container. Templates use `{{variable}}` syntax for data merge fields.

## Project structure

```
react-client/src/
├── components/wizard/   # Document generation wizard (steps 1–5)
├── providers/           # Graph, Auth, Salesforce API providers
├── routes/              # App layout, Opportunities, OpportunityDetail
└── stores/              # SelectionStore (cross-component state)
```
