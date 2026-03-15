import { useCallback, useEffect, useRef, useState } from 'react';
import { useWizard } from './wizard-context';
import StepNavigation from './step-navigation';
import SelectionStore from '../../stores/SelectionStore';
import { fetchTemplateJson } from './utils';
import type { TemplateType } from './global';
import './DocumentGenerator.css';

export default function CustomizeStep() {
    const { state, dispatch, nextStep, prevStep, completeCurrentStep } = useWizard();
    const selection = SelectionStore.instance.get();

    // ── Form fields ──────────────────────────────────────────────
    const [fields, setFields] = useState<Record<string, string>>({
        documentTitle: state.customizations.documentTitle || `${selection?.opportunityName ?? 'Document'} - Proposal`,
        authorName: state.customizations.authorName || '',
        companyName: state.customizations.companyName || selection?.accountName || '',
        footerNote: state.customizations.footerNote || 'Confidential — For internal use only',
        primaryColor: state.customizations.primaryColor || '#4f46e5',
    });

    useEffect(() => {
        dispatch({ type: 'SET_CUSTOMIZATIONS', payload: fields });
    }, [fields, dispatch]);

    const set = (key: string, value: string) => setFields(prev => ({ ...prev, [key]: value }));

    // ── Document Authoring editor ────────────────────────────────
    const editorRef = useRef<HTMLDivElement>(null);
    const editorInstanceRef = useRef<any>(null);
    const isInitializing = useRef(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editorError, setEditorError] = useState<string | null>(null);

    const initializeEditor = useCallback(async () => {
        if (isInitializing.current) return;
        if (!editorRef.current || !state.template) {
            console.warn('Container or template not available');
            return;
        }

        if (editorInstanceRef.current) {
            try { editorInstanceRef.current.destroy(); } catch { /* ignore */ }
            editorInstanceRef.current = null;
        }

        isInitializing.current = true;
        setIsLoading(true);
        setEditorError(null);

        try {
            let docAuthSystem = state.docAuthSystem;
            if (!docAuthSystem) {
                if (!window.DocAuth) throw new Error('Document Authoring SDK not loaded');
                docAuthSystem = await window.DocAuth.createDocAuthSystem();
                dispatch({ type: 'SET_DOC_AUTH_SYSTEM', payload: docAuthSystem });
            }

            // Load template — always via importDOCX since our templates are .docx files
            let templateBinary: ArrayBuffer;
            if (state.template === 'custom' && state.customTemplateBinary) {
                templateBinary = state.customTemplateBinary;
            } else {
                templateBinary = await fetchTemplateJson(state.template as TemplateType);
            }
            const templateDocument = await docAuthSystem.importDOCX(templateBinary);
            dispatch({ type: 'SET_TEMPLATE_DOCUMENT', payload: templateDocument });

            // Clear container, then mount editor
            const container = editorRef.current!;
            while (container.firstChild) container.removeChild(container.firstChild);
            await new Promise(resolve => setTimeout(resolve, 300));

            const editor = await docAuthSystem.createEditor(container, { document: templateDocument });
            editorInstanceRef.current = editor;
            dispatch({ type: 'SET_TEMPLATE_EDITOR', payload: editor });
        } catch (error: any) {
            console.error('Error initializing editor:', error);
            setEditorError(error?.message ?? 'Failed to load editor');
        } finally {
            setIsLoading(false);
            isInitializing.current = false;
        }
    }, [state.template, state.docAuthSystem, state.customTemplateBinary, dispatch]);

    useEffect(() => {
        if (state.currentStep === 1) {
            initializeEditor();
        }
        return () => {
            if (editorInstanceRef.current) {
                try { editorInstanceRef.current.destroy(); } catch { /* ignore */ }
                editorInstanceRef.current = null;
            }
        };
    }, [state.currentStep, initializeEditor]);

    // ── Navigation ───────────────────────────────────────────────
    const handleNext = () => { completeCurrentStep(); nextStep(); };

    return (
        <div className="flex flex-col h-full">

            {/* ── Form fields strip ── */}
            <div className="step2-form">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Document Title
                        </label>
                        <input
                            type="text"
                            value={fields.documentTitle}
                            onChange={(e) => set('documentTitle', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            placeholder="Sales Proposal Q1 2025"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Author Name
                        </label>
                        <input
                            type="text"
                            value={fields.authorName}
                            onChange={(e) => set('authorName', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            placeholder="Your name"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Company / Account</label>
                        <input
                            type="text"
                            value={fields.companyName}
                            onChange={(e) => set('companyName', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            placeholder="Account name"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Footer Note</label>
                        <input
                            type="text"
                            value={fields.footerNote}
                            onChange={(e) => set('footerNote', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            placeholder="e.g. Confidential"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Brand Color</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={fields.primaryColor}
                                onChange={(e) => set('primaryColor', e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer border border-gray-300"
                                title="Brand color"
                                aria-label="Brand color"
                            />
                            <span className="text-xs text-gray-500 font-mono">{fields.primaryColor}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Editor fills remaining space ── */}
            <div className="step2-editor-area">

                {isLoading && (
                    <div className="flex flex-col items-center justify-center flex-1 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3" />
                        <p className="text-sm text-gray-600">Loading editor…</p>
                    </div>
                )}

                {editorError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-2">
                        {editorError}
                    </div>
                )}

                <div ref={editorRef} className={isLoading ? '' : 'editor-container'} />
            </div>

            <StepNavigation canProceed={true} onNext={handleNext} onBack={prevStep} />
        </div>
    );
}
