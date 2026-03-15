import { useWizard } from './wizard-context';

interface StepNavigationProps {
    canProceed: boolean;
    onNext?: () => void;
    onBack?: () => void;
    nextLabel?: string;
    isLastStep?: boolean;
}

export default function StepNavigation({ canProceed, onNext, onBack, nextLabel, isLastStep }: StepNavigationProps) {
    const { prevStep, state } = useWizard();

    const handleBack = () => {
        if (onBack) onBack();
        else prevStep();
    };

    return (
        <div className="step-nav-bar flex items-center justify-between px-6 py-2.5 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
                type="button"
                onClick={handleBack}
                disabled={state.currentStep === 0}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
            </button>

            <button
                type="button"
                onClick={onNext}
                disabled={!canProceed}
                className={`inline-flex items-center px-6 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200
                    ${canProceed
                        ? 'bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow-md'
                        : 'bg-indigo-300 cursor-not-allowed'}`}
            >
                {nextLabel || (isLastStep ? 'Finish' : 'Next')}
                {!isLastStep && (
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                )}
            </button>
        </div>
    );
}
