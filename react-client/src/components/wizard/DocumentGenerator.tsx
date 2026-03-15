import { WizardProvider, useWizard } from './wizard-context';
import './DocumentGenerator.css';
import StepIndicator from './step-indicator';
import TemplateStep from './step-1-template';
import CustomizeStep from './step-2-customize';
import DataStep from './step-3-data';
import PreviewStep from './step-4-preview';
import DownloadStep from './step-5-download';

interface DocumentGeneratorProps {
    onClose: () => void;
}

function StepContent({ onClose }: { onClose: () => void }) {
    const { state } = useWizard();
    switch (state.currentStep) {
        case 0: return <TemplateStep />;
        case 1: return <CustomizeStep />;
        case 2: return <DataStep />;
        case 3: return <PreviewStep />;
        case 4: return <DownloadStep onClose={onClose} />;
        default: return <TemplateStep />;
    }
}

export default function DocumentGenerator({ onClose }: DocumentGeneratorProps) {
    return (
        <div className="doc-gen-page">
            <WizardProvider>
                {/* Gradient hero — title, subtitle, step indicator */}
                <div className="doc-gen-hero">
                    <button
                        type="button"
                        onClick={onClose}
                        className="doc-gen-back-btn"
                        aria-label="Back to opportunity"
                    >
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back
                    </button>

                    <h1 className="doc-gen-title">Document Generator</h1>
                    <p className="doc-gen-subtitle">Create professional documents in just a few steps</p>

                    <StepIndicator />
                </div>

                {/* White content card */}
                <div className="doc-gen-step-content">
                    <StepContent onClose={onClose} />
                </div>
            </WizardProvider>
        </div>
    );
}
