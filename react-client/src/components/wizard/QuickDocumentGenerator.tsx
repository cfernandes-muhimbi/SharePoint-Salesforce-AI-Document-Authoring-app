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
            <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900">Choose a Template</h2>
                <p className="text-gray-500 text-sm">Select the document type to generate automatically.</p>
                <div className="flex gap-6 mt-2">
                    <button
                        type="button"
                        onClick={() => { setSelectedTemplate('invoice'); setPhase('running'); }}
                        className="flex flex-col items-center gap-3 w-44 p-6 bg-white border-2 border-gray-200 hover:border-indigo-500 hover:shadow-md rounded-2xl transition-all group"
                    >
                        <span className="text-5xl">🧾</span>
                        <span className="font-semibold text-gray-800 group-hover:text-indigo-700">Invoice</span>
                        <span className="text-xs text-gray-400">invoice_template_with_terms.docx</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => { setSelectedTemplate('msa'); setPhase('running'); }}
                        className="flex flex-col items-center gap-3 w-44 p-6 bg-white border-2 border-gray-200 hover:border-indigo-500 hover:shadow-md rounded-2xl transition-all group"
                    >
                        <span className="text-5xl">📋</span>
                        <span className="font-semibold text-gray-800 group-hover:text-indigo-700">MSA</span>
                        <span className="text-xs text-gray-400">msa_template.docx</span>
                    </button>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="mt-4 text-sm text-gray-400 hover:text-gray-600 underline"
                >
                    Cancel
                </button>
            </div>
        );
    }

    if (phase === 'running') {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
                <div className="w-14 h-14 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <div className="text-center">
                    <p className="text-gray-700 font-medium">{statusText}</p>
                    <p className="text-gray-400 text-sm mt-1">Please wait while we prepare your document…</p>
                </div>
            </div>
        );
    }

    if (phase === 'error') {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
                <div className="text-5xl">❌</div>
                <h2 className="text-xl font-bold text-gray-900">Generation Failed</h2>
                <p className="text-sm text-red-600 max-w-md">{errorMsg}</p>
                <button
                    type="button"
                    onClick={onClose}
                    className="mt-2 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                >
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
