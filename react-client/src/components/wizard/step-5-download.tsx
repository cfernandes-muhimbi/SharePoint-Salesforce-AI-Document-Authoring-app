import { useState } from 'react';
import { PeoplePicker } from '@microsoft/mgt-react';
import { useWizard } from './wizard-context';
import { GraphProvider } from '../../providers/GraphProvider';

interface DownloadStepProps {
    onClose: () => void;
}

const SAVE_CONTAINER_ID = 'b!0H8UuMhhCE21scpbsG1DtJAuao1T-ftJu8nAgaJOh8Faa-T6Ou3KSKnT1--2SrMp';

export default function DownloadStep({ onClose }: DownloadStepProps) {
    const { state } = useWizard();

    const [savedItem, setSavedItem] = useState<{ driveId: string; itemId: string } | null>(null);
    const [status, setStatus]   = useState<'idle' | 'exporting' | 'uploading' | 'done' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [savedUrl, setSavedUrl] = useState<string | null>(null);

    // People-picker / send-review state
    const [selectedPeople, setSelectedPeople] = useState<any[]>([]);
    const [reviewMessage, setReviewMessage] = useState('');
    const [sending, setSending]   = useState(false);
    const [sendMsg, setSendMsg]   = useState<string | null>(null);
    const [sendError, setSendError] = useState<string | null>(null);

    const contacts = (state.templateData as any)?.contacts ?? [];
    const filename  = `${state.customizations.documentTitle || 'document'}.docx`;
    const isDone    = status === 'done';
    const isBusy    = status === 'exporting' || status === 'uploading';

    // ── Download + upload ────────────────────────────────────────────────
    const handleDownload = async () => {
        if (!state.docxDocument) {
            setErrorMsg('No document available — complete the previous steps first.');
            setStatus('error');
            return;
        }

        setStatus('exporting');
        setErrorMsg(null);

        let buffer: ArrayBuffer;
        try {
            buffer = await state.docxDocument.exportDOCX();
        } catch (err: any) {
            setErrorMsg(err?.message ?? 'Failed to export DOCX');
            setStatus('error');
            return;
        }

        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        setStatus('uploading');
        try {
            const file = new File([buffer], filename, {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });
            const item = await GraphProvider.instance.uploadFile(SAVE_CONTAINER_ID, file, 'root');
            setSavedUrl(item.webUrl ?? null);
            const driveId = item.parentReference?.driveId ?? SAVE_CONTAINER_ID;
            setSavedItem({ driveId, itemId: item.id! });
            setStatus('done');
        } catch (err: any) {
            setErrorMsg(`Downloaded locally, but failed to save to container: ${err?.message ?? err}`);
            setStatus('error');
        }
    };

    // ── Send review card ─────────────────────────────────────────────────
    const handleSendReview = async () => {
        if (!selectedPeople.length || !savedUrl) return;

        setSending(true);
        setSendMsg(null);
        setSendError(null);

        const senderName = state.customizations.authorName || 'A colleague';
        const docTitle   = state.customizations.documentTitle || filename;
        const errors: string[] = [];

        for (const person of selectedPeople) {
            const id = person.id ?? person.userId;
            if (!id) { errors.push(`Could not resolve ID for ${person.displayName}`); continue; }
            try {
                // Grant edit access first, then notify via Teams
                if (savedItem) {
                    await GraphProvider.instance.grantEditPermission(savedItem.driveId, savedItem.itemId, id);
                }
                await GraphProvider.instance.sendReviewCard(id, docTitle, savedUrl, senderName, reviewMessage || undefined);
            } catch (err: any) {
                errors.push(`${person.displayName}: ${err?.message ?? err}`);
            }
        }

        setSending(false);
        if (errors.length) {
            setSendError(errors.join(' · '));
        } else {
            setSendMsg(`Review request sent to ${selectedPeople.map(p => p.displayName).join(', ')}`);
        }
    };

    // ── Render ───────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-[#F7F5F2]">
            {!isDone ? (

                /* ── Ready to Download ── */
                <div className="w-full max-w-md bg-white border border-[#E6D3A3] rounded-2xl shadow-sm overflow-hidden">

                    {/* Header band */}
                    <div className="px-8 pt-8 pb-6 border-b border-[#E6D3A3]">
                        {/* Document icon */}
                        <div className="flex justify-center mb-5">
                            <div className="w-12 h-12 rounded-xl bg-[#F7F5F2] border border-[#E6D3A3] flex items-center justify-center">
                                <svg className="w-6 h-6 text-[#2D2D2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-[#2D2D2D] text-center tracking-tight mb-1">
                            Ready to Download
                        </h2>
                        <p className="text-sm text-[#8A817C] text-center">
                            Your document is ready to save.
                        </p>
                    </div>

                    {/* Details */}
                    <div className="px-8 py-5 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[#8A817C] font-medium">Document</span>
                            <span className="text-[#2D2D2D] font-semibold">
                                {state.customizations.documentTitle || 'document'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[#8A817C] font-medium">Template</span>
                            <span className="text-[#2D2D2D] capitalize">{state.template || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[#8A817C] font-medium">Contacts</span>
                            <span className="text-[#2D2D2D]">{contacts.length} included</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[#8A817C] font-medium">File</span>
                            <span className="text-[#2D2D2D] font-mono text-xs truncate max-w-[200px]">{filename}</span>
                        </div>
                    </div>

                    {/* Error */}
                    {errorMsg && (
                        <div className="mx-8 mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
                            {errorMsg}
                        </div>
                    )}

                    {/* Action */}
                    <div className="px-8 pb-8">
                        <button
                            type="button"
                            onClick={handleDownload}
                            disabled={isBusy}
                            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2D2D2D] hover:bg-[#3d3d3d] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                        >
                            {isBusy ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {status === 'uploading' ? 'Saving to container…' : 'Exporting…'}
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download &amp; Save to Container
                                </>
                            )}
                        </button>
                    </div>
                </div>

            ) : (

                /* ── Document Saved ── */
                <div className="w-full max-w-md space-y-4">

                    {/* Success card */}
                    <div className="bg-white border border-[#E6D3A3] rounded-2xl shadow-sm px-8 py-7">
                        <div className="flex justify-center mb-5">
                            <div className="w-12 h-12 rounded-xl bg-[#F7F5F2] border border-[#E6D3A3] flex items-center justify-center">
                                <svg className="w-6 h-6 text-[#2D2D2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-[#2D2D2D] text-center tracking-tight mb-1">
                            Document Saved
                        </h2>
                        <p className="text-sm text-[#8A817C] text-center mb-1">
                            <span className="font-medium text-[#2D2D2D]">{filename}</span>
                        </p>
                        <p className="text-xs text-[#8A817C] text-center mb-5">
                            Downloaded and saved to the container.
                        </p>

                        {savedUrl && (
                            <a
                                href={savedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#F7F5F2] border border-[#E6D3A3] text-[#2D2D2D] text-sm font-medium rounded-xl hover:bg-[#E6D3A3] transition-colors"
                            >
                                <svg className="w-4 h-4 text-[#8A817C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Open in SharePoint
                            </a>
                        )}
                    </div>

                    {/* Send for review */}
                    {savedUrl && (
                        <div className="bg-white border border-[#E6D3A3] rounded-2xl shadow-sm px-6 py-5">
                            <h3 className="text-sm font-semibold text-[#2D2D2D] mb-4 flex items-center gap-2">
                                <svg className="w-4 h-4 text-[#8A817C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                                </svg>
                                Send for Review via Teams
                            </h3>

                            <label className="block text-xs font-medium text-[#8A817C] mb-1.5">Reviewer(s)</label>
                            <PeoplePicker
                                selectionChanged={(e: any) => setSelectedPeople(e.detail ?? [])}
                                selectionMode="multiple"
                                placeholder="Search people…"
                            />

                            <label className="block text-xs font-medium text-[#8A817C] mt-3 mb-1.5">Message (optional)</label>
                            <textarea
                                value={reviewMessage}
                                onChange={(e) => setReviewMessage(e.target.value)}
                                rows={3}
                                placeholder="Add a note for the reviewer…"
                                className="w-full px-3 py-2 text-sm text-[#2D2D2D] bg-[#F7F5F2] border border-[#E6D3A3] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#2D2D2D] placeholder:text-[#8A817C]"
                            />

                            {sendMsg && (
                                <p className="mt-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                    {sendMsg}
                                </p>
                            )}
                            {sendError && (
                                <p className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                    {sendError}
                                </p>
                            )}

                            <button
                                type="button"
                                onClick={handleSendReview}
                                disabled={sending || selectedPeople.length === 0}
                                className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2D2D2D] hover:bg-[#3d3d3d] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40"
                            >
                                {sending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Sending…
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                        Send Review Request
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full px-6 py-2.5 bg-[#F7F5F2] border border-[#E6D3A3] hover:bg-[#E6D3A3] text-[#2D2D2D] text-sm font-medium rounded-xl transition-colors"
                    >
                        Back to Opportunity
                    </button>
                </div>
            )}
        </div>
    );
}
