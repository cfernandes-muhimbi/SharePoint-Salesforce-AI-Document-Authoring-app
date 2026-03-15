import React, { createContext, useContext, useReducer } from 'react';

export interface WizardState {
    currentStep: number;
    completedSteps: number[];
    template: string;
    customTemplateBinary: ArrayBuffer | null;
    customizations: Record<string, string>;
    templateData: Record<string, unknown>;
    docAuthSystem: any | null;
    templateDocument: any | null;
    templateEditor: any | null;
    docxDocument: any | null;
    docxEditor: any | null;
    pdfDocument: ArrayBuffer | null;
}

type WizardAction =
    | { type: 'SET_STEP'; payload: number }
    | { type: 'COMPLETE_STEP'; payload: number }
    | { type: 'SET_TEMPLATE'; payload: string }
    | { type: 'SET_CUSTOM_TEMPLATE_BINARY'; payload: ArrayBuffer | null }
    | { type: 'SET_CUSTOMIZATIONS'; payload: Record<string, string> }
    | { type: 'SET_TEMPLATE_DATA'; payload: Record<string, unknown> }
    | { type: 'SET_DOC_AUTH_SYSTEM'; payload: any }
    | { type: 'SET_TEMPLATE_DOCUMENT'; payload: any }
    | { type: 'SET_TEMPLATE_EDITOR'; payload: any }
    | { type: 'SET_DOCX_DOCUMENT'; payload: any }
    | { type: 'SET_DOCX_EDITOR'; payload: any }
    | { type: 'SET_PDF_DOCUMENT'; payload: ArrayBuffer | null };

const initialState: WizardState = {
    currentStep: 0,
    completedSteps: [],
    template: '',
    customTemplateBinary: null,
    customizations: {},
    templateData: {},
    docAuthSystem: null,
    templateDocument: null,
    templateEditor: null,
    docxDocument: null,
    docxEditor: null,
    pdfDocument: null,
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
    switch (action.type) {
        case 'SET_STEP':
            return { ...state, currentStep: action.payload };
        case 'COMPLETE_STEP':
            return {
                ...state,
                completedSteps: state.completedSteps.includes(action.payload)
                    ? state.completedSteps
                    : [...state.completedSteps, action.payload],
            };
        case 'SET_TEMPLATE':
            return { ...state, template: action.payload };
        case 'SET_CUSTOM_TEMPLATE_BINARY':
            return { ...state, customTemplateBinary: action.payload };
        case 'SET_CUSTOMIZATIONS':
            return { ...state, customizations: action.payload };
        case 'SET_TEMPLATE_DATA':
            return { ...state, templateData: action.payload };
        case 'SET_DOC_AUTH_SYSTEM':
            return { ...state, docAuthSystem: action.payload };
        case 'SET_TEMPLATE_DOCUMENT':
            return { ...state, templateDocument: action.payload };
        case 'SET_TEMPLATE_EDITOR':
            return { ...state, templateEditor: action.payload };
        case 'SET_DOCX_DOCUMENT':
            return { ...state, docxDocument: action.payload };
        case 'SET_DOCX_EDITOR':
            return { ...state, docxEditor: action.payload };
        case 'SET_PDF_DOCUMENT':
            return { ...state, pdfDocument: action.payload };
        default:
            return state;
    }
}

interface WizardContextValue {
    state: WizardState;
    dispatch: React.Dispatch<WizardAction>;
    nextStep: () => void;
    prevStep: () => void;
    completeCurrentStep: () => void;
}

const WizardContext = createContext<WizardContextValue | undefined>(undefined);

export function WizardProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(wizardReducer, initialState);
    const nextStep = () => dispatch({ type: 'SET_STEP', payload: Math.min(state.currentStep + 1, 4) });
    const prevStep = () => dispatch({ type: 'SET_STEP', payload: Math.max(state.currentStep - 1, 0) });
    const completeCurrentStep = () => dispatch({ type: 'COMPLETE_STEP', payload: state.currentStep });

    return (
        <WizardContext.Provider value={{ state, dispatch, nextStep, prevStep, completeCurrentStep }}>
            {children}
        </WizardContext.Provider>
    );
}

export function useWizard() {
    const ctx = useContext(WizardContext);
    if (!ctx) throw new Error('useWizard must be used inside WizardProvider');
    return ctx;
}
