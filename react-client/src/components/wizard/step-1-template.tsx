import { useCallback, useEffect, useRef, useState } from 'react';
import { useWizard } from './wizard-context';
import StepNavigation from './step-navigation';

const templates = [
    {
        id: 'invoice',
        name: 'Invoice Template',
        description: 'Professional invoice with payment terms for client billing',
        filename: 'invoice_template_with_terms.docx',
        category: 'Business',
        color: '#4F46E5',
        icon: (
            <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <rect width="80" height="100" rx="6" fill="#EEF2FF" />
                <rect x="12" y="14" width="36" height="5" rx="2" fill="#4F46E5" />
                <rect x="12" y="26" width="56" height="3" rx="1.5" fill="#C7D2FE" />
                <rect x="12" y="33" width="50" height="3" rx="1.5" fill="#C7D2FE" />
                <rect x="12" y="46" width="56" height="2" rx="1" fill="#E0E7FF" />
                <rect x="12" y="52" width="56" height="2" rx="1" fill="#E0E7FF" />
                <rect x="12" y="58" width="40" height="2" rx="1" fill="#E0E7FF" />
                <rect x="12" y="70" width="56" height="2" rx="1" fill="#E0E7FF" />
                <rect x="12" y="76" width="56" height="2" rx="1" fill="#E0E7FF" />
                <rect x="12" y="82" width="30" height="2" rx="1" fill="#E0E7FF" />
                <rect x="44" y="88" width="24" height="6" rx="2" fill="#4F46E5" />
            </svg>
        ),
    },
    {
        id: 'msa',
        name: 'MSA Template',
        description: 'Master Service Agreement for professional engagements',
        filename: 'msa_template.docx',
        category: 'Legal',
        color: '#0891B2',
        icon: (
            <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <rect width="80" height="100" rx="6" fill="#ECFEFF" />
                <rect x="12" y="14" width="42" height="5" rx="2" fill="#0891B2" />
                <rect x="12" y="26" width="56" height="3" rx="1.5" fill="#A5F3FC" />
                <rect x="12" y="33" width="48" height="3" rx="1.5" fill="#A5F3FC" />
                <rect x="12" y="40" width="52" height="3" rx="1.5" fill="#A5F3FC" />
                <rect x="12" y="52" width="56" height="2" rx="1" fill="#CFFAFE" />
                <rect x="12" y="58" width="56" height="2" rx="1" fill="#CFFAFE" />
                <rect x="12" y="64" width="44" height="2" rx="1" fill="#CFFAFE" />
                <rect x="12" y="74" width="22" height="6" rx="2" fill="#0891B2" opacity="0.4" />
                <rect x="12" y="85" width="30" height="2" rx="1" fill="#CFFAFE" />
                <rect x="46" y="74" width="22" height="6" rx="2" fill="#0891B2" opacity="0.4" />
                <rect x="46" y="85" width="22" height="2" rx="1" fill="#CFFAFE" />
            </svg>
        ),
    },
];

export default function TemplateStep() {
    const { state, dispatch, nextStep, completeCurrentStep } = useWizard();
    const [selectedTemplate, setSelectedTemplate] = useState<string>(state.template || '');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setSelectedTemplate(state.template || '');
    }, [state.template]);

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplate(templateId);
        dispatch({ type: 'SET_TEMPLATE', payload: templateId });
        if (templateId !== 'custom') {
            setSelectedFile(null);
            dispatch({ type: 'SET_CUSTOM_TEMPLATE_BINARY', payload: null });
        }
        setUploadError(null);
    };

    const validateFile = (file: File): string | null => {
        if (file.size > 10 * 1024 * 1024) return 'File size must be less than 10MB';
        if (file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
            return 'Please select a valid DOCX file';
        return null;
    };

    const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (reader.result instanceof ArrayBuffer) resolve(reader.result);
                else reject(new Error('Failed to read file as ArrayBuffer'));
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });

    const handleFileSelect = useCallback(async (file: File) => {
        setUploadError(null);
        const err = validateFile(file);
        if (err) { setUploadError(err); return; }
        try {
            const buffer = await readFileAsArrayBuffer(file);
            setSelectedFile(file);
            setSelectedTemplate('custom');
            dispatch({ type: 'SET_TEMPLATE', payload: 'custom' });
            dispatch({ type: 'SET_CUSTOM_TEMPLATE_BINARY', payload: buffer });
        } catch {
            setUploadError('Failed to read the selected file');
        }
    }, [dispatch]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    const handleNext = () => {
        if (selectedTemplate) { completeCurrentStep(); nextStep(); }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Template</h2>
                    <p className="text-lg text-gray-600">Select a template to get started with your document</p>
                </div>

                {/* Template Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-2xl mx-auto">
                    {templates.map((t) => (
                        <div
                            key={t.id}
                            onClick={() => handleTemplateSelect(t.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleTemplateSelect(t.id)}
                            className={`relative group cursor-pointer rounded-xl border-2 transition-all duration-200 overflow-hidden
                                ${selectedTemplate === t.id
                                    ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-lg'
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'}`}
                        >
                            {/* Preview */}
                            <div className="aspect-[3/4] bg-gray-50 overflow-hidden flex items-center justify-center p-6">
                                <div className="w-32 h-40 group-hover:scale-105 transition-transform duration-200 drop-shadow-md">
                                    {t.icon}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900 flex-1">{t.name}</h3>
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                                        {t.category}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">{t.description}</p>
                                <p className="text-xs text-gray-400 mt-1 font-mono">{t.filename}</p>
                            </div>

                            {/* Selection indicator */}
                            {selectedTemplate === t.id && (
                                <div className="absolute top-3 right-3 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Custom Upload */}
                <div
                    className={`relative p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-200
                        ${isDragOver ? 'border-indigo-400 bg-indigo-50' :
                          selectedTemplate === 'custom' ? 'border-indigo-500 bg-indigo-50' :
                          'border-gray-300 hover:border-gray-400'}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".docx"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                        className="hidden"
                    />

                    <svg
                        className={`mx-auto h-12 w-12 ${isDragOver || selectedTemplate === 'custom' ? 'text-indigo-500' : 'text-gray-400'}`}
                        stroke="currentColor" fill="none" viewBox="0 0 48 48"
                    >
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>

                    <div className="mt-4">
                        <h3 className={`text-lg font-medium ${selectedTemplate === 'custom' ? 'text-indigo-900' : 'text-gray-900'}`}>
                            Upload Custom Template
                        </h3>

                        {selectedFile ? (
                            <div className="mt-2">
                                <p className="text-sm text-indigo-600 font-medium">✓ {selectedFile.name}</p>
                                <p className="text-xs text-gray-500 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600 mt-1">
                                {isDragOver ? 'Drop your DOCX file here' : 'Drag and drop your DOCX file here, or click to browse'}
                            </p>
                        )}

                        {!selectedFile && (
                            <span className="mt-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                                Choose File
                            </span>
                        )}

                        {selectedFile && (
                            <span
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFile(null);
                                    setSelectedTemplate('');
                                    dispatch({ type: 'SET_TEMPLATE', payload: '' });
                                    dispatch({ type: 'SET_CUSTOM_TEMPLATE_BINARY', payload: null });
                                    setUploadError(null);
                                }}
                                className="mt-3 inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                            >
                                Remove File
                            </span>
                        )}
                    </div>

                    {selectedTemplate === 'custom' && selectedFile && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}
                </div>

                {uploadError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{uploadError}</p>
                    </div>
                )}
            </div>

            <StepNavigation canProceed={!!selectedTemplate} onNext={handleNext} />
        </div>
    );
}
