import type { TemplateType } from './global';
import { GraphProvider } from '../../providers/GraphProvider';
import { TEMPLATE_CONTAINER_ID } from '../../common/Constants';

const TEMPLATE_FILENAMES: Record<string, string> = {
    invoice: 'invoice_template_with_terms.docx',
    msa: 'msa_template.docx',
};

/**
 * Finds the named template DOCX in the configured SPE container and returns it as an ArrayBuffer.
 * Requires REACT_APP_TEMPLATE_CONTAINER_ID to be set in .env.
 */
export async function fetchTemplateJson(template: TemplateType): Promise<ArrayBuffer> {
    const filename = TEMPLATE_FILENAMES[template];
    if (!filename) throw new Error(`Unknown template type: ${template}`);

    if (!TEMPLATE_CONTAINER_ID) {
        throw new Error(
            'REACT_APP_TEMPLATE_CONTAINER_ID is not set. Add the container ID to .env and restart.'
        );
    }

    const items = await GraphProvider.instance.listItems(TEMPLATE_CONTAINER_ID, 'root');
    const item = items.find(i => i.name === filename);

    if (!item) {
        throw new Error(`Template file "${filename}" was not found in the container. Upload it first.`);
    }
    if (!item.downloadUrl) {
        throw new Error(`No download URL available for "${filename}".`);
    }

    const response = await fetch(item.downloadUrl);
    if (!response.ok) {
        throw new Error(`Failed to download "${filename}": ${response.statusText}`);
    }
    return response.arrayBuffer();
}
