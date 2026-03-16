# AI-Driven Document Generation with Salesforce & SharePoint Embedded

A modern **AI-powered document automation application** that integrates
**Salesforce CRM with SharePoint Embedded** to generate, edit, and
securely store documents using CRM data.

This project demonstrates how developers can build **document-centric
enterprise applications** using SharePoint Embedded as the storage layer
while leveraging Microsoft 365 services for security, scalability, and
collaboration.

------------------------------------------------------------------------

## 🎥 ## Demo

### Video

[![Watch the demo](https://img.youtube.com/vi/tebA7cKz4-E/maxresdefault.jpg)](https://www.youtube.com/watch?v=tebA7cKz4-E)

------------------------------------------------------------------------

## Overview

Organizations frequently generate documents such as:

-   Sales proposals\
-   Contracts\
-   Master Service Agreements\
-   Invoices\
-   Statements of Work

In many companies this process is still **manual and inefficient**.

Sales teams often:

-   Copy data from CRM systems into document templates\
-   Create multiple document versions manually\
-   Send documents via email for review\
-   Store files across multiple disconnected systems

This results in:

-   Human errors in documents\
-   Lost productivity\
-   Expensive CRM storage costs\
-   Poor collaboration and version control

This application simplifies that workflow by **automating document
creation directly from Salesforce data** while storing documents
securely in **SharePoint Embedded containers**.

------------------------------------------------------------------------

## Solution

The application connects **Salesforce CRM with SharePoint Embedded** to
automate document generation.

Users can:

1.  Browse Salesforce opportunities\
2.  Select a document template\
3.  Automatically populate templates with CRM data\
4.  Preview and edit the document\
5.  Store documents securely in SharePoint Embedded\
6.  Send document review requests via Microsoft Teams

This transforms a traditionally manual workflow into a **fully automated
document generation pipeline**.

------------------------------------------------------------------------

## Key Features

### AI-Powered Document Generation

Automatically generate documents using reusable templates populated with
CRM data.

### Quick Template Generation

Generate documents instantly from Salesforce opportunities.

### Document Preview & Editing

Preview and edit DOCX documents using the **Nutrient Document Authoring
SDK**.

### Secure Document Storage

Documents are stored in **SharePoint Embedded containers**, benefiting
from Microsoft 365 security and compliance.

### Collaboration via Microsoft Teams

Send document review requests using **Microsoft Teams Adaptive Cards**.

------------------------------------------------------------------------

## Architecture

The solution connects several modern cloud services to enable secure
document workflows.

Salesforce CRM\
↓\
Azure Functions (Integration Layer)\
↓\
React + TypeScript Application\
↓\
SharePoint Embedded Containers\
↓\
Microsoft Teams (Collaboration & Review)

### Architecture Diagram

![Architecture Diagram](https://clavinfernandes.wordpress.com/wp-content/uploads/2026/03/arch.png)


## Why This Architecture

Traditionally, CRM platforms store both **business data and
documents**.\
This can become expensive and limits collaboration capabilities.

This solution introduces a modern architecture:

**Salesforce → Business Data**\
**SharePoint Embedded → Documents & Collaboration**

Benefits include:

-   Reduced CRM storage costs\
-   Enterprise-grade document security\
-   Seamless collaboration using Microsoft services\
-   Scalable document management architecture

SharePoint Embedded enables developers to build **cross-platform
document-centric applications** across web apps, mobile apps, and custom
enterprise solutions.

------------------------------------------------------------------------

## Technology Stack

### Frontend

-   React
-   TypeScript
-   Create React App

### Microsoft Services

-   Microsoft Graph
-   SharePoint Embedded
-   Microsoft Teams
-   Microsoft Graph Toolkit (MGT)

### Backend

-   Azure Functions
-   Salesforce API

### Document Processing

-   Nutrient Document Authoring SDK
-   docxtemplater
-   PizZip

------------------------------------------------------------------------

## Project Structure

    react-client/src/
    ├── components/wizard/   # Document generation wizard
    ├── providers/           # Graph, Auth, Salesforce providers
    ├── routes/              # App layout and opportunity views
    └── stores/              # Shared application state

------------------------------------------------------------------------


### Environment Variables

Create a `.env` file in `react-client/`.

    REACT_APP_AZURE_APP_ID=<Azure AD client ID>
    REACT_APP_AZURE_SERVER_APP_ID=<Server App ID>
    REACT_APP_TENANT_ID=<Tenant ID>
    REACT_APP_SPE_CONTAINER_TYPE_ID=<Container Type ID>
    REACT_APP_TEMPLATE_CONTAINER_ID=<Template Container ID>
    REACT_APP_SP_ROOT_SITE_URL=<SharePoint Root URL>

------------------------------------------------------------------------

### Run Locally

    npm install
    npm start

The application runs at:

    http://localhost:3000

------------------------------------------------------------------------

## Templates

Upload your templates to the **SharePoint Embedded template container**.

Example templates:

-   `invoice_template_with_terms.docx`
-   `msa_template.docx`

Templates use **docxtemplater merge syntax**:

    {{variable}}

These variables are automatically populated using **Salesforce
opportunity data**.

------------------------------------------------------------------------



------------------------------------------------------------------------

## Contributors

**Clavin Fernandes**\
Solutions Engineer --- Nutrient\
https://www.linkedin.com/in/clavin-fernandes-38a30862/

**Dhanashree Fernandes**\
Technical Consultant --- SAS Waters\
https://www.linkedin.com/in/dhanashree-fernandes-96640285/
