export type TemplateType = 'invoice' | 'msa';

export interface DocAuthDocument {
    [key: string]: unknown;
}

interface DocAuthEditor {
    destroy(): void;
}

interface DocAuthSystem {
    importDOCX(binary: ArrayBuffer): Promise<DocAuthDocument>;
    loadDocument(json: object): Promise<DocAuthDocument>;
    createEditor(
        container: HTMLElement,
        options: { document: DocAuthDocument }
    ): Promise<DocAuthEditor>;
}

export interface CodeMirrorInstance {
    getValue(): string;
    setValue(value: string): void;
    on(event: string, handler: () => void): void;
    refresh(): void;
}

interface NutrientStatic {
    populateDocumentTemplate(
        templateBuffer: ArrayBuffer,
        data: Record<string, unknown>
    ): Promise<ArrayBuffer>;
}

declare global {
    interface Window {
        DocAuth: {
            createDocAuthSystem(): Promise<DocAuthSystem>;
        };
        CodeMirror: (element: HTMLElement, options: Record<string, unknown>) => CodeMirrorInstance;
        NutrientViewer?: NutrientStatic;
        PSPDFKit?: NutrientStatic;
    }
}
