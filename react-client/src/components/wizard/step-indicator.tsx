import { useWizard } from './wizard-context';

const STEPS = ['Template', 'Customize', 'Data', 'Preview', 'Download'];

export default function StepIndicator() {
    const { state, dispatch } = useWizard();

    return (
        <div className="flex items-center justify-center">
            {STEPS.map((label, index) => {
                const isCompleted = state.completedSteps.includes(index);
                const isCurrent = state.currentStep === index;
                const isClickable = isCompleted || index <= Math.max(...state.completedSteps, 0);

                return (
                    <div key={index} className="flex items-center">
                        <div
                            className="flex flex-col items-center cursor-pointer"
                            onClick={() => isClickable && dispatch({ type: 'SET_STEP', payload: index })}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200
                                ${isCurrent ? 'bg-indigo-600 text-white ring-4 ring-indigo-200' :
                                  isCompleted ? 'bg-green-500 text-white' :
                                  'bg-gray-200 text-gray-500'}`}
                            >
                                {isCompleted && !isCurrent ? (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    index + 1
                                )}
                            </div>
                            <span className={`mt-1 text-xs font-medium ${isCurrent ? 'text-indigo-700' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                                {label}
                            </span>
                        </div>

                        {index < STEPS.length - 1 && (
                            <div className={`w-16 h-1 mx-2 mb-4 rounded transition-all duration-200 ${isCompleted ? 'bg-green-400' : 'bg-gray-300'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
