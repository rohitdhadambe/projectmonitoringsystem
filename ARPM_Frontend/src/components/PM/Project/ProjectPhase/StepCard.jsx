import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { STEP_STATUS_MAP } from "./PhaseTab";

function Badge({ status, map }) {
    const s = map[status] || { label: status, cls: "bg-gray-100 text-gray-500" };
    return <span className={`px-2 py-1 text-xs rounded-full font-semibold ${s.cls}`}>{s.label}</span>;
}

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300";

export default function StepCard({
    step, phase, stepIndex,
    isLocked, userRole, onRefresh
}) {
    const { user } = useAuth();

    // ✅ Clear role flags
    const isPM = userRole === "pm";
    const isResearcher = userRole === "researcher";
    const isCommittee = userRole === "committee";

    const [expanded, setExpanded] = useState(false);
    const [docTypes, setDocTypes] = useState([]);
    const [notes, setNotes] = useState(step.notes || "");
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [reviewing, setReviewing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [uploadRows, setUploadRows] = useState([]);

    useEffect(() => { if (expanded) fetchDocTypes(); }, [expanded]);
    useEffect(() => { setNotes(step.notes || ""); }, [step.notes]);

    const fetchDocTypes = async () => {
        const res = await fetch(`http://127.0.0.1:8000/phases/steps/${step.id}/document-types`);
        if (res.ok) {
            const data = await res.json();
            setDocTypes(data.document_types || []);
            setUploadRows(
                (data.document_types || []).map(dt => ({
                    type: dt.type, label: dt.label, required: dt.required, file: null,
                }))
            );
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // ✅ ROLE-BASED PERMISSIONS — this is the key fix
    //
    // Researcher: edit content, upload docs, submit step
    // PM:         review step only (approve → next unlocks), send back for revision
    // Committee:  read-only always
    // ─────────────────────────────────────────────────────────────────────────

    const phaseIsActive = ["active", "revision_requested"].includes(phase.status);
    const stepNotFinished = !["submitted", "reviewed"].includes(step.status);
    const stepNotLocked = !isLocked;

    // ✅ Only researcher can edit/upload
    const canEdit = isResearcher && phaseIsActive && stepNotFinished && stepNotLocked;

    // ✅ Only researcher can submit a step (draft or in_progress)
    const canSubmit = isResearcher
        && ["draft", "in_progress"].includes(step.status)
        && phaseIsActive
        && stepNotLocked;

    // ✅ Only PM can review (mark as reviewed) — only when submitted
    const canReview = isPM && step.status === "submitted";

    // ✅ PM can send step back for re-work
    const canReturnStep = isPM && step.status === "submitted";

    // ─── Handlers ─────────────────────────────────────────────────────────────

    const handleSaveContent = async () => {
        setSaving(true); setError("");
        try {
            const res = await fetch(`http://127.0.0.1:8000/phases/steps/${step.id}/content`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notes, assigned_to: user?.user_id }),
            });
            if (!res.ok) { setError((await res.json()).detail); return; }
            onRefresh();
        } finally { setSaving(false); }
    };

    const handleUploadDocs = async () => {
        const toUpload = uploadRows.filter(r => r.file);
        if (!toUpload.length) { setError("Select at least one file."); return; }
        setUploading(true); setError("");
        try {
            for (const row of toUpload) {
                const fd = new FormData();
                fd.append("uploaded_by", user?.user_id);
                fd.append("document_title", row.label);
                fd.append("document_type", row.type);
                fd.append("file", row.file);
                const res = await fetch(
                    `http://127.0.0.1:8000/phases/steps/${step.id}/upload`,
                    { method: "POST", body: fd }
                );
                if (!res.ok) { setError((await res.json()).detail); return; }
            }
            setUploadRows(prev => prev.map(r => ({ ...r, file: null })));
            onRefresh();
        } finally { setUploading(false); }
    };

    const handleDeleteDoc = async (docId) => {
        if (!confirm("Delete this document?")) return;
        await fetch(`http://127.0.0.1:8000/phases/steps/documents/${docId}`, { method: "DELETE" });
        onRefresh();
    };

    const handleSubmitStep = async () => {
        setSubmitting(true); setError("");
        try {
            const res = await fetch(
                `http://127.0.0.1:8000/phases/steps/${step.id}/submit`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ submitted_by: user?.user_id }),
                }
            );
            if (!res.ok) {
                const err = await res.json();
                setError(Array.isArray(err.detail)
                    ? err.detail.map(e => e.msg).join(", ")
                    : err.detail || "Failed to submit");
                return;
            }
            onRefresh();
        } finally { setSubmitting(false); }
    };

    const handleReviewStep = async () => {
        setReviewing(true); setError("");
        try {
            const res = await fetch(
                `http://127.0.0.1:8000/phases/steps/${step.id}/review`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reviewed_by: user?.user_id }),
                }
            );
            if (!res.ok) {
                const err = await res.json();
                setError(Array.isArray(err.detail)
                    ? err.detail.map(e => e.msg).join(", ")
                    : err.detail || "Failed to review");
                return;
            }
            onRefresh();
        } finally { setReviewing(false); }
    };

    // PM returns step → reset to in_progress so researcher can re-edit
    const handleReturnStep = async () => {
        setReviewing(true); setError("");
        try {
            const res = await fetch(`http://127.0.0.1:8000/phases/steps/${step.id}/return`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ returned_by: user?.user_id }),
            });
            if (!res.ok) { setError((await res.json()).detail); return; }
            onRefresh();
        } finally { setReviewing(false); }
    };

    // ─── Circle style ─────────────────────────────────────────────────────────
    const circleCls = step.status === "reviewed"
        ? "bg-green-500 text-white"
        : step.status === "submitted"
            ? "bg-yellow-500 text-white"
            : step.status === "in_progress" || step.status === "draft"
                ? "bg-blue-500 text-white"
                : isLocked
                    ? "bg-gray-100 text-gray-300"
                    : "bg-gray-200 text-gray-600";

    return (
        <div className={`rounded-lg border overflow-hidden transition ${isLocked ? "opacity-60 border-gray-100" : "border-gray-200"
            }`}>

            {/* ── Header ── */}
            <div
                className={`flex items-center justify-between px-4 py-3 ${isLocked ? "cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"
                    }`}
                onClick={() => !isLocked && setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${circleCls}`}>
                        {step.status === "reviewed" ? "✓"
                            : isLocked ? "🔒"
                                : step.step_number}
                    </div>
                    <div>
                        <p className={`text-sm font-medium ${isLocked ? "text-gray-400" : "text-gray-700"}`}>
                            {step.step_name}
                        </p>
                        {isLocked && (
                            <p className="text-xs text-gray-400">
                                Complete step {step.step_number - 1} first
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge status={step.status} map={STEP_STATUS_MAP} />
                    {!isLocked && (
                        <span className="text-gray-400 text-xs">{expanded ? "▲" : "▼"}</span>
                    )}
                </div>
            </div>

            {/* ── Expanded body ── */}
            {expanded && !isLocked && (
                <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50/30">

                    {step.description && (
                        <p className="text-xs text-gray-500 italic">{step.description}</p>
                    )}

                    {/* ── Status notices ── */}
                    {step.status === "submitted" && isPM && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                            📤 Researcher has submitted this step. Review the content and documents below, then approve or return.
                        </div>
                    )}
                    {step.status === "reviewed" && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
                            ✅ Step approved by PM.
                        </div>
                    )}
                    {step.status === "submitted" && isResearcher && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-700">
                            📤 Submitted to PM for review. Waiting for response.
                        </div>
                    )}

                    {/* ── Content area ── */}
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Step Content / Notes</p>
                        <textarea
                            rows={6}
                            // ✅ PM sees content read-only, researcher can edit
                            disabled={!canEdit}
                            placeholder={
                                isResearcher
                                    ? `Write your ${step.step_name} content here. You can save drafts and edit over multiple sessions.`
                                    : "Researcher's notes will appear here."
                            }
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className={`${inputCls} resize-none ${!canEdit ? "bg-gray-50 text-gray-600 cursor-default" : ""
                                }`}
                        />
                        {/* ✅ Save Draft — researcher only */}
                        {canEdit && (
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={handleSaveContent}
                                    disabled={saving}
                                    className="px-4 py-1.5 bg-gray-700 hover:bg-gray-800 text-white text-xs rounded-lg disabled:opacity-60 transition"
                                >
                                    {saving ? "Saving..." : "💾 Save Draft"}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ── Documents ── */}
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Documents</p>

                        {/* Uploaded docs list — everyone can view, researcher can delete (pre-submit) */}
                        {(step.documents || []).length > 0 ? (
                            <div className="space-y-1.5 mb-3">
                                {step.documents.map(doc => (
                                    <div key={doc.id}
                                        className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span>📄</span>
                                            <div>
                                                <p className="font-medium text-gray-700">{doc.document_title}</p>
                                                <p className="text-gray-400 capitalize">
                                                    {doc.document_type?.replace(/_/g, " ")}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <a href={doc.file_path} target="_blank" rel="noreferrer"
                                                className="text-purple-600 hover:underline">View ↗</a>
                                            {/* ✅ Only researcher can delete, only before submission */}
                                            {canEdit && (
                                                <button onClick={() => handleDeleteDoc(doc.id)}
                                                    className="text-red-400 hover:text-red-600">Delete</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 italic mb-3">No documents uploaded yet.</p>
                        )}

                        {/* ✅ Upload rows — researcher only */}
                        {canEdit && uploadRows.length > 0 && (
                            <div className="space-y-2 mb-3">
                                {uploadRows.map((row, i) => (
                                    <div key={row.type} className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-5 flex items-center gap-1 text-xs text-gray-600">
                                            {row.required && <span className="text-red-500 font-bold">*</span>}
                                            {row.label}
                                        </div>
                                        <label className="col-span-7 flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:border-purple-400 transition">
                                            <span>📁</span>
                                            <span className="truncate">{row.file ? row.file.name : "Choose file"}</span>
                                            <input type="file" className="hidden"
                                                onChange={e => {
                                                    const updated = [...uploadRows];
                                                    updated[i] = { ...updated[i], file: e.target.files[0] || null };
                                                    setUploadRows(updated);
                                                }} />
                                        </label>
                                    </div>
                                ))}
                                <div className="flex justify-end mt-1">
                                    <button
                                        onClick={handleUploadDocs}
                                        disabled={uploading}
                                        className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg disabled:opacity-60 transition"
                                    >
                                        {uploading ? "Uploading..." : "⬆️ Upload Selected"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ✅ Custom upload — researcher only */}
                        {canEdit && (
                            <CustomDocUpload stepId={step.id} userId={user?.user_id} onUploaded={onRefresh} />
                        )}
                    </div>

                    {error && <p className="text-red-500 text-xs">{error}</p>}

                    {/* ── Actions ── */}
                    <div className="flex gap-3 flex-wrap pt-1 border-t border-gray-100">

                        {/* ✅ Researcher: submit step */}
                        {canSubmit && (
                            <button
                                onClick={handleSubmitStep}
                                disabled={submitting}
                                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold rounded-lg disabled:opacity-60 transition"
                            >
                                {submitting ? "Submitting..." : "📤 Mark Step Complete"}
                            </button>
                        )}

                        {/* ✅ PM: approve step → marks as reviewed, unlocks next */}
                        {canReview && (
                            <button
                                onClick={handleReviewStep}
                                disabled={reviewing}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg disabled:opacity-60 transition"
                            >
                                {reviewing ? "..." : "✅ Approve Step"}
                            </button>
                        )}

                        {/* ✅ PM: return step to researcher for revision */}
                        {canReturnStep && (
                            <button
                                onClick={handleReturnStep}
                                disabled={reviewing}
                                className="px-4 py-2 border-2 border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg disabled:opacity-60 transition"
                            >
                                {reviewing ? "..." : "↩ Return to Researcher"}
                            </button>
                        )}

                        {step.status === "reviewed" && (
                            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                ✅ Step approved
                            </span>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
}

// ─── Custom doc upload ────────────────────────────────────────────────────────
function CustomDocUpload({ stepId, userId, onUploaded }) {
    const [show, setShow] = useState(false);
    const [title, setTitle] = useState("");
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleUpload = async () => {
        if (!title.trim() || !file) return;
        const fd = new FormData();
        fd.append("uploaded_by", userId);
        fd.append("document_title", title);
        fd.append("document_type", "other");
        fd.append("file", file);
        try {
            setUploading(true);
            await fetch(`http://127.0.0.1:8000/phases/steps/${stepId}/upload`, {
                method: "POST", body: fd,
            });
            setTitle(""); setFile(null); setShow(false);
            onUploaded();
        } finally { setUploading(false); }
    };

    if (!show) return (
        <button onClick={() => setShow(true)}
            className="text-xs text-gray-400 hover:text-purple-500 transition">
            + Add custom document
        </button>
    );

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2 mt-2">
            <p className="text-xs font-semibold text-gray-600">Custom Document</p>
            <input
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder="Document title"
                value={title}
                onChange={e => setTitle(e.target.value)}
            />
            <label className="flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:border-purple-400">
                <span>📁</span>
                <span>{file ? file.name : "Choose file"}</span>
                <input type="file" className="hidden"
                    onChange={e => setFile(e.target.files[0] || null)} />
            </label>
            <div className="flex gap-2 justify-end">
                <button onClick={() => setShow(false)} className="text-xs text-gray-400">Cancel</button>
                <button
                    onClick={handleUpload}
                    disabled={uploading || !title || !file}
                    className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg disabled:opacity-60 transition"
                >
                    {uploading ? "..." : "Upload"}
                </button>
            </div>
        </div>
    );
}