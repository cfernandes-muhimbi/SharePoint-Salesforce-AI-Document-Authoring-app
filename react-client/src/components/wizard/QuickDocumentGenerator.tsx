import { useEffect, useState } from 'react';
import { WizardProvider, useWizard } from './wizard-context';
import DownloadStep from './step-5-download';
import SelectionStore from '../../stores/SelectionStore';
import { SalesforceApiProvider } from '../../providers/SalesforceApiProvider';
import { fetchTemplateJson } from './utils';
import type { TemplateType } from './global';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import './DocumentGenerator.css';

interface QuickDocumentGeneratorProps {
    onClose: () => void;
}

function QuickPipeline({ onClose }: { onClose: () => void }) {
    const { dispatch } = useWizard();
    const [phase, setPhase] = useState<'select' | 'running' | 'done' | 'error'>('select');
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [statusText, setStatusText] = useState('Initializing…');

    useEffect(() => {
        if (phase !== 'running' || !selectedTemplate) return;

        const run = async () => {
            const selection = SelectionStore.instance.get();
            if (!selection?.opportunityId) {
                setErrorMsg('No opportunity selected. Please go back and select one.');
                setPhase('error');
                return;
            }

            try {
                // Step 1: Fetch Salesforce data
                setStatusText('Fetching Salesforce data…');
                const opp = await SalesforceApiProvider.instance.getOpportunity(selection.opportunityId);
                const contacts = opp.accountContacts ?? [];

                const templateData: Record<string, unknown> = {
                    opportunity: {
                        id: opp.Id,
                        name: opp.Name,
                        stage: opp.StageName,
                        amount: opp.Amount,
                        closeDate: opp.CloseDate,
                        probability: opp.Probability,
                        type: opp.Type,
                        leadSource: opp.LeadSource,
                        description: opp.Description,
                    },
                    account: { name: opp.Account?.Name ?? '' },
                    owner: { name: opp.Owner?.Name ?? '', email: opp.Owner?.Email ?? '' },
                    contacts: contacts.map(c => ({
                        id: c.Id, name: c.Name, email: c.Email, phone: c.Phone, title: c.Title,
                    })),
                };
                dispatch({ type: 'SET_TEMPLATE_DATA', payload: templateData });
                dispatch({ type: 'SET_TEMPLATE', payload: selectedTemplate });
                dispatch({ type: 'SET_CUSTOMIZATIONS', payload: {
                    documentTitle: opp.Name ?? 'Document',
                    authorName: opp.Owner?.Name ?? '',
                }});

                // Step 2: Initialize DocAuth system
                setStatusText('Initializing document system…');
                if (!window.DocAuth) throw new Error('DocAuth SDK not loaded. Ensure it is included in index.html.');
                const docAuthSystem = await window.DocAuth.createDocAuthSystem();
                dispatch({ type: 'SET_DOC_AUTH_SYSTEM', payload: docAuthSystem });

                // Step 3: Load template from SPE container
                setStatusText('Loading template from container…');
                const templateBuffer = await fetchTemplateJson(selectedTemplate);

                // Step 4: Import template into DocAuth
                setStatusText('Importing template…');
                const templateDocument = await docAuthSystem.importDOCX(templateBuffer);
                dispatch({ type: 'SET_TEMPLATE_DOCUMENT', payload: templateDocument });

                // Step 5: Export template buffer and populate with docxtemplater
                setStatusText('Populating document with Salesforce data…');
                const exportedBuffer: ArrayBuffer = await (templateDocument as any).exportDOCX();

                const str = (v: unknown) => (v != null ? String(v) : '');
                const data = templateData as any;
                const opp2 = data.opportunity ?? {};
                const acc  = data.account     ?? {};
                const own  = data.owner       ?? {};

                const flat: Record<string, unknown> = {
                    opportunity_id:          str(opp2.id),
                    opportunity_name:        str(opp2.name),
                    opportunity_stage:       str(opp2.stage),
                    opportunity_amount:      str(opp2.amount),
                    opportunity_close_date:  str(opp2.closeDate),
                    opportunity_closeDate:   str(opp2.closeDate),
                    opportunity_probability: str(opp2.probability),
                    opportunity_type:        str(opp2.type),
                    opportunity_lead_source: str(opp2.leadSource),
                    opportunity_leadSource:  str(opp2.leadSource),
                    opportunity_description: str(opp2.description),

                    name:        str(opp2.name),
                    stage:       str(opp2.stage),
                    amount:      str(opp2.amount),
                    close_date:  str(opp2.closeDate),
                    closeDate:   str(opp2.closeDate),
                    probability: str(opp2.probability),
                    type:        str(opp2.type),
                    lead_source: str(opp2.leadSource),
                    leadSource:  str(opp2.leadSource),
                    description: str(opp2.description),

                    account_name: str(acc.name),
                    company_name: str(acc.name),
                    company:      str(acc.name),

                    owner_name:  str(own.name),
                    owner_email: str(own.email),
                    owner:       str(own.name),

                    document_title: str(opp2.name),
                    author_name:    str(own.name),
                    footer_note:    '',
                    primary_color:  '',

                    contacts: (data.contacts ?? []).map((c: any) => ({
                        id:            str(c.id),
                        name:          str(c.name),
                        email:         str(c.email),
                        phone:         str(c.phone),
                        title:         str(c.title),
                        contact_name:  str(c.name),
                        contact_email: str(c.email),
                        contact_phone: str(c.phone),
                        contact_title: str(c.title),
                    })),
                };

                const firstContact = (data.contacts ?? [])[0] ?? {};
                flat.contact_name  = str(firstContact.name);
                flat.contact_title = str(firstContact.title);
                flat.contact_email = str(firstContact.email);
                flat.contact_phone = str(firstContact.phone);

                (data.contacts ?? []).forEach((c: any, i: number) => {
                    const n = i + 1;
                    flat[`contact_${n}_name`]  = str(c.name);
                    flat[`contact_${n}_title`] = str(c.title);
                    flat[`contact_${n}_email`] = str(c.email);
                    flat[`contact_${n}_phone`] = str(c.phone);
                });

                const zip = new PizZip(exportedBuffer);
                const doc = new Docxtemplater(zip, {
                    delimiters: { start: '{{', end: '}}' },
                    paragraphLoop: true,
                    linebreaks: true,
                    nullGetter: () => '',
                });
                doc.render(flat);

                const populatedBuffer: ArrayBuffer = doc.getZip().generate({
                    type: 'arraybuffer',
                    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                });

                // Step 6: Import populated document back into DocAuth
                setStatusText('Finalizing document…');
                const docxDocument = await docAuthSystem.importDOCX(populatedBuffer);
                dispatch({ type: 'SET_DOCX_DOCUMENT', payload: docxDocument });

                setPhase('done');
            } catch (err: any) {
                console.error('Quick AI pipeline error:', err);
                setErrorMsg(err?.message ?? 'An unexpected error occurred during document generation.');
                setPhase('error');
            }
        };

        run();
    }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

    if (phase === 'select') {
        return (
            <div className="qdg-select">
                <div className="qdg-select-header">
                    <h2 className="qdg-select-title">Choose a Template</h2>
                    <p className="qdg-select-sub">Select the document type to generate automatically.</p>
                </div>

                <div className="qdg-template-grid">
                    {/* Invoice */}
                    <button
                        type="button"
                        className="qdg-template-card"
                        onClick={() => { setSelectedTemplate('invoice'); setPhase('running'); }}
                    >
                        <div className="qdg-template-icon qdg-template-icon--invoice">
                            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M9 12h6m-6 4h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                            </svg>
                        </div>
                        <span className="qdg-template-name">Invoice</span>
                        <span className="qdg-template-file">invoice_template_with_terms.docx</span>
                    </button>

                    {/* MSA */}
                    <button
                        type="button"
                        className="qdg-template-card"
                        onClick={() => { setSelectedTemplate('msa'); setPhase('running'); }}
                    >
                        <div className="qdg-template-icon qdg-template-icon--msa">
                            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        <span className="qdg-template-name">MSA</span>
                        <span className="qdg-template-file">msa_template.docx</span>
                    </button>
                </div>

                <button type="button" className="qdg-cancel-btn" onClick={onClose}>
                    Cancel
                </button>
            </div>
        );
    }

    if (phase === 'running') {
        return (
            <div className="qdg-running">
                <div className="qdg-spinner" />
                <p className="qdg-running-status">{statusText}</p>
                <p className="qdg-running-hint">Please wait while we prepare your document…</p>
            </div>
        );
    }

    if (phase === 'error') {
        return (
            <div className="qdg-error">
                <div className="qdg-error-icon">
                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                </div>
                <h2 className="qdg-error-title">Generation Failed</h2>
                <p className="qdg-error-msg">{errorMsg}</p>
                <button type="button" className="qdg-error-btn" onClick={onClose}>
                    Go Back
                </button>
            </div>
        );
    }

    return <DownloadStep onClose={onClose} />;
}

export default function QuickDocumentGenerator({ onClose }: QuickDocumentGeneratorProps) {
    return (
        <div className="doc-gen-page">
            <WizardProvider>
                <div className="doc-gen-hero">
                    <button
                        type="button"
                        onClick={onClose}
                        className="doc-gen-back-btn"
                        aria-label="Back"
                    >
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back
                    </button>
                    <h1 className="doc-gen-title">Quick AI Templates</h1>
                    <p className="doc-gen-subtitle">Select a template and generate your document instantly</p>
                </div>
                <div className="doc-gen-step-content">
                    <QuickPipeline onClose={onClose} />
                </div>
            </WizardProvider>
        </div>
    );
}
