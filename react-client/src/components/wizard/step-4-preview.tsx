import { useCallback, useEffect, useRef, useState } from "react";
import { useWizard } from "./wizard-context";
import StepNavigation from "./step-navigation";

export default function PreviewStep() {
    const { state, dispatch, completeCurrentStep, nextStep, prevStep } = useWizard();
    const editorRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const isInitializing = useRef(false);
    const editorInstanceRef = useRef<any>(null);

    const initializeEditor = useCallback(async () => {
        if (isInitializing.current || !editorRef.current || !state.docxDocument) return;

        if (editorInstanceRef.current) {
            try { editorInstanceRef.current.destroy(); } catch { /* ignore */ }
            editorInstanceRef.current = null;
        }

        isInitializing.current = true;
        setIsLoading(true);
        setPreviewError(null);

        try {
            const docAuthSystem = state.docAuthSystem;
            if (!docAuthSystem) throw new Error('Document Authoring system not initialized');

            const container = editorRef.current!;
            while (container.firstChild) container.removeChild(container.firstChild);
            await new Promise(resolve => setTimeout(resolve, 200));

            const editor = await docAuthSystem.createEditor(container, {
                document: state.docxDocument,
            });

            editorInstanceRef.current = editor;
            dispatch({ type: 'SET_DOCX_EDITOR', payload: editor });
        } catch (err: any) {
            console.error('Error initializing preview editor:', err);
            setPreviewError(err?.message ?? 'Failed to load preview');
        } finally {
            setIsLoading(false);
            isInitializing.current = false;
        }
    }, [state.docxDocument, state.docAuthSystem, dispatch]);

    useEffect(() => {
        if (state.currentStep === 3) {
            initializeEditor();
        }
        return () => {
            if (editorInstanceRef.current) {
                try { editorInstanceRef.current.destroy(); } catch { /* ignore */ }
                editorInstanceRef.current = null;
            }
        };
    }, [state.currentStep, initializeEditor]);

    const handleNext = () => {
        completeCurrentStep();
        nextStep();
    };

    return (
        <div className="flex flex-col h-full">

            {/* Header */}
            <div className="flex-shrink-0 px-6 pt-5 pb-3 text-center border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Preview & Edit</h2>
                <p className="text-sm text-gray-500 mt-0.5">Review and make final adjustments to your document</p>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-16 flex-shrink-0">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3" />
                    <p className="text-gray-600 text-sm">
                        {state.docxDocument ? 'Generating PDF…' : 'Loading preview…'}
                    </p>
                </div>
            )}

            {/* Error */}
            {previewError && (
                <div className="mx-6 mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-red-700 text-sm flex-shrink-0">
                    {previewError}
                </div>
            )}

            {/* Editor */}
            {!state.docxDocument && !isLoading && (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                    No document generated yet — go back to Step 3 and click Next.
                </div>
            )}

            <div ref={editorRef} className={state.docxDocument && !isLoading ? 'editor-container mx-6 my-3 flex-1' : 'hidden'} />

            <StepNavigation
                canProceed={!!state.docxDocument && !isLoading}
                onNext={handleNext}
                onBack={prevStep}
                nextLabel="Download"
            />
        </div>
    );
}
