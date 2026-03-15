import { useEffect, useRef, useState } from 'react';
import { useWizard } from './wizard-context';
import StepNavigation from './step-navigation';
import SelectionStore from '../../stores/SelectionStore';
import { ISalesforceOpportunityDetail, SalesforceApiProvider } from '../../providers/SalesforceApiProvider';
import type { CodeMirrorInstance } from './global';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export default function DataStep() {
    const { state, dispatch, nextStep, prevStep, completeCurrentStep } = useWizard();
    const selection = SelectionStore.instance.get();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [opp, setOpp] = useState<ISalesforceOpportunityDetail | null>(null);
    const [viewMode, setViewMode] = useState<'cards' | 'json'>('cards');
    const [jsonError, setJsonError] = useState<string | null>(null);

    const cmRef = useRef<HTMLDivElement>(null);
    const cmInstanceRef = useRef<CodeMirrorInstance | null>(null);

    useEffect(() => {
        if (!selection?.opportunityId) {
            setError('No opportunity selected. Please go back and select one.');
            setLoading(false);
            return;
        }
        SalesforceApiProvider.instance
            .getOpportunity(selection.opportunityId)
            .then((data) => {
                setOpp(data);
                const contacts = data.accountContacts ?? [];
                const payload: Record<string, unknown> = {
                    opportunity: {
                        id: data.Id,
                        name: data.Name,
                        stage: data.StageName,
                        amount: data.Amount,
                        closeDate: data.CloseDate,
                        probability: data.Probability,
                        type: data.Type,
                        leadSource: data.LeadSource,
                        description: data.Description,
                    },
                    account: { name: data.Account?.Name ?? '' },
                    owner: {
                        name: data.Owner?.Name ?? '',
                        email: data.Owner?.Email ?? '',
                    },
                    contacts: contacts.map((c) => ({
                        id: c.Id,
                        name: c.Name,
                        email: c.Email,
                        phone: c.Phone,
                        title: c.Title,
                    })),
                };
                dispatch({ type: 'SET_TEMPLATE_DATA', payload });
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [selection?.opportunityId, dispatch]);

    // Mount / destroy CodeMirror when switching to JSON view
    useEffect(() => {
        if (viewMode !== 'json' || !cmRef.current) return;

        if (!window.CodeMirror) {
            setJsonError('CodeMirror not loaded');
            return;
        }

        // Destroy previous instance
        if (cmInstanceRef.current) {
            cmInstanceRef.current = null;
            cmRef.current.innerHTML = '';
        }

        const instance = window.CodeMirror(cmRef.current, {
            value: JSON.stringify(state.templateData, null, 2),
            mode: 'application/json',
            theme: 'material',
            lineNumbers: true,
            lineWrapping: false,
            tabSize: 2,
            indentWithTabs: false,
            autofocus: true,
        });

        instance.on('change', () => {
            try {
                const parsed = JSON.parse(instance.getValue());
                setJsonError(null);
                dispatch({ type: 'SET_TEMPLATE_DATA', payload: parsed });
            } catch {
                setJsonError('Invalid JSON — changes will not be saved until fixed');
            }
        });

        cmInstanceRef.current = instance;

        return () => {
            cmInstanceRef.current = null;
        };
    }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

    const [generating, setGenerating] = useState(false);
    const [genError, setGenError] = useState<string | null>(null);

    const formatCurrency = (n: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

    const handleNext = async () => {
        if (!state.templateDocument || !state.docAuthSystem) {
            completeCurrentStep();
            nextStep();
            return;
        }

        setGenerating(true);
        setGenError(null);
        try {
            // 1. Export the template document to a raw DOCX ArrayBuffer
            const templateBuffer: ArrayBuffer = await state.templateDocument.exportDOCX();

            // 2. Build flat template-data object — include every naming convention
            //    the DOCX template might use so nothing is left as "undefined"
            const data = state.templateData as any;
            const opp2 = data.opportunity ?? {};
            const acc  = data.account     ?? {};
            const own  = data.owner       ?? {};

            const str = (v: unknown) => (v != null ? String(v) : '');

            const flat: Record<string, unknown> = {
                // ── Opportunity — prefixed ──────────────────────────
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

                // ── Opportunity — unprefixed (most templates use these) ─
                name:         str(opp2.name),
                stage:        str(opp2.stage),
                amount:       str(opp2.amount),
                close_date:   str(opp2.closeDate),
                closeDate:    str(opp2.closeDate),
                probability:  str(opp2.probability),
                type:         str(opp2.type),
                lead_source:  str(opp2.leadSource),
                leadSource:   str(opp2.leadSource),
                description:  str(opp2.description),

                // ── Account ─────────────────────────────────────────
                account_name:  str(acc.name),
                company_name:  str(acc.name),
                company:       str(acc.name),

                // ── Owner ────────────────────────────────────────────
                owner_name:  str(own.name),
                owner_email: str(own.email),
                owner:       str(own.name),

                // ── Customisations from Step 2 ───────────────────────
                document_title: str(state.customizations.documentTitle || opp2.name),
                author_name:    str(state.customizations.authorName    || own.name),
                footer_note:    str(state.customizations.footerNote),
                primary_color:  str(state.customizations.primaryColor),

                // ── Contacts array for {{#contacts}}…{{/contacts}} ───
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

            // ── First contact as top-level vars for templates without loop syntax ──
            const firstContact = (data.contacts ?? [])[0] ?? {};
            flat.contact_name  = str(firstContact.name);
            flat.contact_title = str(firstContact.title);
            flat.contact_email = str(firstContact.email);
            flat.contact_phone = str(firstContact.phone);

            // Also add indexed vars for multi-contact templates: {{contact_1_name}} etc.
            (data.contacts ?? []).forEach((c: any, i: number) => {
                const n = i + 1;
                flat[`contact_${n}_name`]  = str(c.name);
                flat[`contact_${n}_title`] = str(c.title);
                flat[`contact_${n}_email`] = str(c.email);
                flat[`contact_${n}_phone`] = str(c.phone);
            });

            // 3. Fill template using docxtemplater
            const zip = new PizZip(templateBuffer);
            const doc = new Docxtemplater(zip, {
                delimiters: { start: '{{', end: '}}' },
                paragraphLoop: true,
                linebreaks: true,
                // Return empty string for any tag not found in flat — prevents "undefined" in output
                nullGetter: () => '',
            });
            doc.render(flat);

            const populatedBuffer: ArrayBuffer = doc
                .getZip()
                .generate({ type: 'arraybuffer', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

            // 4. Re-import populated buffer for preview/export
            const docxDocument = await state.docAuthSystem.importDOCX(populatedBuffer);
            dispatch({ type: 'SET_DOCX_DOCUMENT', payload: docxDocument });
            completeCurrentStep();
            nextStep();
        } catch (err: any) {
            console.error('Document generation failed:', err);
            setGenError(err?.message ?? 'Failed to generate document');
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-gray-600">Loading Salesforce data…</p>
            </div>
        );
    }

    if (error || !opp) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
                <StepNavigation canProceed={false} onNext={handleNext} onBack={prevStep} />
            </div>
        );
    }

    const contacts = opp.accountContacts ?? [];

    return (
        <div className="flex flex-col h-full">

            {/* ── Toggle bar ── */}
            <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-200 bg-white flex-shrink-0">
                <span className="text-sm font-medium text-gray-700">View:</span>
                <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                        viewMode === 'cards'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    Cards
                </button>

                {/* Toggle switch */}
                <button
                    type="button"
                    onClick={() => setViewMode(v => v === 'cards' ? 'json' : 'cards')}
                    aria-label="Toggle view"
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        viewMode === 'json' ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                >
                    <span
                        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                            viewMode === 'json' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                </button>

                <button
                    type="button"
                    onClick={() => setViewMode('json')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                        viewMode === 'json'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    JSON
                </button>

                {jsonError && (
                    <span className="ml-2 text-xs text-red-600">{jsonError}</span>
                )}
            </div>

            {/* ── Cards view ── */}
            {viewMode === 'cards' && (
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* Opportunity */}
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-indigo-600 px-5 py-3 flex items-center gap-2">
                                <span className="text-white font-semibold">📄 Opportunity</span>
                                <span className="ml-auto text-indigo-200 text-xs font-mono">{opp.Id}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-px bg-gray-100">
                                {[
                                    ['Name', opp.Name],
                                    ['Stage', opp.StageName],
                                    ['Amount', opp.Amount != null ? formatCurrency(opp.Amount) : '—'],
                                    ['Close Date', opp.CloseDate],
                                    ['Probability', opp.Probability != null ? `${opp.Probability}%` : '—'],
                                    ['Type', opp.Type ?? '—'],
                                    ['Lead Source', opp.LeadSource ?? '—'],
                                    ['Account', opp.Account?.Name ?? '—'],
                                ].map(([label, value]) => (
                                    <div key={label} className="bg-white px-4 py-3">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                                        <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
                                    </div>
                                ))}
                            </div>
                            {opp.Description && (
                                <div className="bg-white px-4 py-3 border-t border-gray-100">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Description</p>
                                    <p className="text-sm text-gray-700 mt-0.5">{opp.Description}</p>
                                </div>
                            )}
                        </div>

                        {/* Owner */}
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-indigo-500 px-5 py-3">
                                <span className="text-white font-semibold">👤 Owner</span>
                            </div>
                            <div className="grid grid-cols-2 gap-px bg-gray-100">
                                <div className="bg-white px-4 py-3">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Name</p>
                                    <p className="text-sm font-medium text-gray-900 mt-0.5">{opp.Owner?.Name ?? '—'}</p>
                                </div>
                                <div className="bg-white px-4 py-3">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                                    <p className="text-sm font-medium text-gray-900 mt-0.5">{opp.Owner?.Email ?? '—'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Contacts */}
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-indigo-400 px-5 py-3 flex items-center gap-2">
                                <span className="text-white font-semibold">👥 Account Contacts ({contacts.length})</span>
                                <span className="ml-auto text-indigo-100 text-xs">{opp.Account?.Name}</span>
                            </div>
                            {contacts.length === 0 ? (
                                <div className="px-4 py-6 text-center text-gray-500 text-sm">No contacts found</div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            {['Name', 'Title', 'Email', 'Phone'].map(h => (
                                                <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contacts.map((c, i) => (
                                            <tr key={c.Id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-4 py-2 font-medium text-gray-900">{c.Name}</td>
                                                <td className="px-4 py-2 text-gray-600">{c.Title ?? '—'}</td>
                                                <td className="px-4 py-2 text-indigo-600">
                                                    {c.Email ? <a href={`mailto:${c.Email}`}>{c.Email}</a> : '—'}
                                                </td>
                                                <td className="px-4 py-2 text-gray-600">{c.Phone ?? '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── JSON editor view ── */}
            {viewMode === 'json' && (
                <div className="flex-1 overflow-hidden flex flex-col px-6 py-4 min-h-0">
                    <div ref={cmRef} className="flex-1 min-h-0 overflow-hidden rounded-lg border border-gray-300 text-sm" />
                </div>
            )}

            {genError && (
                <div className="mx-6 mb-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-red-700 text-sm flex-shrink-0">
                    {genError}
                </div>
            )}

            <StepNavigation
                canProceed={!generating}
                onNext={handleNext}
                onBack={prevStep}
                nextLabel={generating ? 'Generating…' : 'Next'}
            />
        </div>
    );
}
