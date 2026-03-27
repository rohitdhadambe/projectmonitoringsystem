import { useEffect, useState } from "react";
import { useAuth } from "../../../../components/context/AuthContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const DOCUMENT_TYPES = [
    { value: "compute_cost_quote", label: "Compute Cost Quote" },
    { value: "data_acquisition_plan", label: "Data Acquisition Plan" },
    { value: "manpower_breakdown", label: "Manpower Breakdown" },
    { value: "infrastructure_quote", label: "Infrastructure Quote" },
    { value: "miscellaneous_justification", label: "Miscellaneous Justification" },
    { value: "other", label: "Other" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
    const map = {
        draft: { label: "Draft", cls: "bg-gray-100 text-gray-600" },
        submitted: { label: "Submitted", cls: "bg-blue-100 text-blue-700" },
        approved: { label: "Approved ✓", cls: "bg-green-100 text-green-700" },
        revision_requested: { label: "Revision Requested", cls: "bg-red-100 text-red-600" },
    };
    const s = map[status] || { label: status, cls: "bg-gray-100 text-gray-600" };
    return (
        <span className={`px-3 py-1 text-sm rounded-full font-semibold ${s.cls}`}>
            {s.label}
        </span>
    );
}

function SectionTitle({ icon, title }) {
    return (
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2 border-b pb-2 mb-4">
            <span>{icon}</span> {title}
        </h3>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="flex justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
            <span className="text-gray-400">{label}</span>
            <span className="text-gray-700 font-medium">{value ?? "—"}</span>
        </div>
    );
}

function formatINR(val) {
    if (!val && val !== 0) return "—";
    return `₹ ${Number(val).toLocaleString("en-IN")}`;
}

// ─── Cost Input ───────────────────────────────────────────────────────────────

function CostInput({ label, field, form, setForm }) {
    return (
        <div>
            <label className="block text-xs text-gray-500 mb-1">{label}</label>
            <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400 text-sm">₹</span>
                <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form[field] ?? ""}
                    onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setForm((prev) => {
                            const next = { ...prev, [field]: val };
                            next.total_budget =
                                (next.compute_cost || 0) +
                                (next.data_acquisition_cost || 0) +
                                (next.manpower_cost || 0) +
                                (next.infrastructure_cost || 0) +
                                (next.miscellaneous_cost || 0);
                            return next;
                        });
                    }}
                    className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
            </div>
        </div>
    );
}

// ─── Document Row ─────────────────────────────────────────────────────────────

function DocRow({ row, index, onChange, onRemove }) {
    return (
        <div className="grid grid-cols-12 gap-2 items-center">

            {/* Title */}
            <input
                placeholder="Document title e.g. GPU Quote"
                value={row.title}
                onChange={(e) => onChange(index, "title", e.target.value)}
                className="col-span-4 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />

            {/* Type */}
            <select
                value={row.type}
                onChange={(e) => onChange(index, "type", e.target.value)}
                className="col-span-3 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
                {DOCUMENT_TYPES.map((dt) => (
                    <option key={dt.value} value={dt.value}>{dt.label}</option>
                ))}
            </select>

            {/* File picker */}
            <label className="col-span-4 flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-500 hover:border-purple-400 hover:text-purple-500 transition">
                <span>📁</span>
                <span className="truncate">{row.file ? row.file.name : "Choose file"}</span>
                <input
                    type="file"
                    className="hidden"
                    onChange={(e) => onChange(index, "file", e.target.files[0] || null)}
                />
            </label>

            {/* Remove */}
            <button
                onClick={() => onRemove(index)}
                className="col-span-1 text-gray-300 hover:text-red-400 text-lg transition text-center"
                title="Remove"
            >
                ✕
            </button>
        </div>
    );
}

// ─── Uploaded Document List ───────────────────────────────────────────────────

function DocumentList({ budgetId, canDelete, refreshTrigger }) {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDocs = async () => {
        setLoading(true);
        const res = await fetch(`http://127.0.0.1:8000/budget/${budgetId}/documents`);
        const data = await res.json();
        setDocs(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    useEffect(() => { fetchDocs(); }, [budgetId, refreshTrigger]);

    const handleDelete = async (docId) => {
        if (!confirm("Delete this document?")) return;
        await fetch(`http://127.0.0.1:8000/budget/documents/${docId}`, { method: "DELETE" });
        fetchDocs();
    };

    if (loading) return <p className="text-sm text-gray-400">Loading documents...</p>;
    if (!docs.length) return (
        <p className="text-sm text-gray-400 italic py-2">No documents uploaded yet.</p>
    );

    return (
        <div className="space-y-2 mb-4">
            {docs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">📄</span>
                        <div>
                            <p className="text-sm font-medium text-gray-700">{doc.document_title}</p>
                            <p className="text-xs text-gray-400 capitalize">
                                {doc.document_type.replace(/_/g, " ")}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <a
                            href={doc.file_path}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-purple-600 hover:underline font-medium"
                        >
                            View ↗
                        </a>
                        {canDelete && (
                            <button
                                onClick={() => handleDelete(doc.id)}
                                className="text-xs text-red-400 hover:text-red-600 transition"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Budget Form ──────────────────────────────────────────────────────────────

function BudgetForm({ projectId, existing, userId, onSaved }) {

    const isEdit = !!existing;

    const [form, setForm] = useState({
        project_id: projectId,
        created_by: userId,
        total_budget: existing?.total_budget || 0,
        justification: existing?.justification || "",
        compute_cost: existing?.compute_cost || 0,
        data_acquisition_cost: existing?.data_acquisition_cost || 0,
        manpower_cost: existing?.manpower_cost || 0,
        infrastructure_cost: existing?.infrastructure_cost || 0,
        miscellaneous_cost: existing?.miscellaneous_cost || 0,
    });

    // ✅ savedBudgetId starts as existing?.id so edit mode shows docs immediately
    const [savedBudgetId, setSavedBudgetId] = useState(existing?.id || null);
    const [saving, setSaving] = useState(false);
    const [savedOnce, setSavedOnce] = useState(isEdit);

    // Document upload rows
    const [docRows, setDocRows] = useState([{ title: "", type: "other", file: null }]);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [docRefresh, setDocRefresh] = useState(0);

    const handleSave = async () => {
        if (!form.total_budget) {
            alert("Total budget must be greater than 0");
            return;
        }
        try {
            setSaving(true);
            const url = savedBudgetId
                ? `http://127.0.0.1:8000/budget/${savedBudgetId}`
                : `http://127.0.0.1:8000/budget/`;
            const method = savedBudgetId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const err = await res.json();
                alert(err.detail || "Error saving budget");
                return;
            }
            const data = await res.json();
            setSavedBudgetId(data.id);
            setSavedOnce(true);
        } finally {
            setSaving(false);
        }
    };

    const updateDocRow = (i, key, val) =>
        setDocRows((prev) =>
            prev.map((row, idx) => (idx === i ? { ...row, [key]: val } : row))
        );

    const handleUpload = async () => {
        if (!savedBudgetId) {
            alert("Please save the budget draft first.");
            return;
        }
        const valid = docRows.filter((r) => r.file && r.title.trim());
        if (!valid.length) {
            setUploadError("Add at least one document with a title and file selected.");
            return;
        }
        setUploadError("");
        try {
            setUploading(true);
            const formData = new FormData();
            formData.append("uploaded_by", userId);
            formData.append(
                "document_meta",
                JSON.stringify(valid.map((r) => ({ title: r.title, type: r.type })))
            );
            valid.forEach((r) => formData.append("files", r.file));

            const res = await fetch(
                `http://127.0.0.1:8000/budget/${savedBudgetId}/documents`,
                { method: "POST", body: formData }
            );
            if (!res.ok) {
                const err = await res.json();
                setUploadError(err.detail || "Upload failed");
                return;
            }
            // Reset rows + refresh list
            setDocRows([{ title: "", type: "other", file: null }]);
            setDocRefresh((n) => n + 1);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-5">

            {/* ── Cost Breakdown ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <SectionTitle icon="💰" title="Cost Breakdown" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <CostInput label="Compute Cost" field="compute_cost" form={form} setForm={setForm} />
                    <CostInput label="Data Acquisition" field="data_acquisition_cost" form={form} setForm={setForm} />
                    <CostInput label="Manpower" field="manpower_cost" form={form} setForm={setForm} />
                    <CostInput label="Infrastructure" field="infrastructure_cost" form={form} setForm={setForm} />
                    <CostInput label="Miscellaneous" field="miscellaneous_cost" form={form} setForm={setForm} />
                </div>
                <div className="mt-4 flex items-center justify-between bg-purple-50 rounded-lg px-4 py-3">
                    <span className="text-sm font-semibold text-purple-700">Total (auto-computed)</span>
                    <span className="text-lg font-bold text-purple-700">{formatINR(form.total_budget)}</span>
                </div>
            </div>

            {/* ── Justification ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <SectionTitle icon="📝" title="Justification" />
                <textarea
                    rows={4}
                    placeholder="Explain why this budget is needed..."
                    value={form.justification}
                    onChange={(e) => setForm({ ...form, justification: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                />
            </div>

            {/* ── Save Draft button ── */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
                >
                    {saving ? "Saving..." : isEdit ? "💾 Save Changes" : "💾 Save Draft"}
                </button>
            </div>

            {/* ── Supporting Documents ── */}
            {/* ✅ Always visible — shows lock message before save, upload UI after */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <SectionTitle icon="📎" title="Supporting Documents" />

                {/* Already-uploaded docs list */}
                {savedBudgetId && (
                    <DocumentList
                        budgetId={savedBudgetId}
                        canDelete={true}
                        refreshTrigger={docRefresh}
                    />
                )}

                {/* Lock message before first save */}
                {!savedOnce && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
                        <span className="text-amber-500">🔒</span>
                        <p className="text-sm text-amber-700">
                            Save the budget draft first to enable document uploads.
                        </p>
                    </div>
                )}

                {/* Upload rows — always rendered, disabled until saved */}
                <div className={`space-y-3 mb-4 ${!savedOnce ? "opacity-40 pointer-events-none select-none" : ""}`}>
                    {docRows.map((row, i) => (
                        <DocRow
                            key={i}
                            row={row}
                            index={i}
                            onChange={updateDocRow}
                            onRemove={(idx) =>
                                setDocRows((prev) => prev.filter((_, j) => j !== idx))
                            }
                        />
                    ))}
                </div>

                {uploadError && (
                    <p className="text-red-500 text-xs mb-3">{uploadError}</p>
                )}

                <div className={`flex items-center justify-between ${!savedOnce ? "opacity-40 pointer-events-none" : ""}`}>
                    <button
                        onClick={() =>
                            setDocRows((prev) => [...prev, { title: "", type: "other", file: null }])
                        }
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                        + Add Another Document
                    </button>

                    <button
                        onClick={handleUpload}
                        disabled={uploading || !savedOnce}
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
                    >
                        {uploading ? "Uploading..." : "⬆️ Upload All"}
                    </button>
                </div>
            </div>

            {/* ── Done button (only after save) ── */}
            {savedOnce && (
                <div className="flex justify-end pb-6">
                    <button
                        onClick={onSaved}
                        className="px-6 py-2 border border-purple-300 text-purple-600 hover:bg-purple-50 text-sm font-medium rounded-lg transition"
                    >
                        ✅ Done
                    </button>
                </div>
            )}

        </div>
    );
}

// ─── Budget View (read mode) ──────────────────────────────────────────────────

function BudgetView({ budget, onSubmit, onEdit, submitting }) {
    const canEdit = ["draft", "revision_requested"].includes(budget.status);
    const canSubmit = ["draft", "revision_requested"].includes(budget.status);

    return (
        <div className="space-y-4">

            {/* Status + action bar */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-400 mb-1">Budget Status</p>
                    <StatusBadge status={budget.status} />
                </div>
                <div className="flex gap-3">
                    {canEdit && (
                        <button
                            onClick={onEdit}
                            className="px-4 py-2 border border-purple-300 text-purple-600 hover:bg-purple-50 text-sm rounded-lg transition"
                        >
                            ✏️ Edit
                        </button>
                    )}
                    {canSubmit && (
                        <button
                            onClick={onSubmit}
                            disabled={submitting}
                            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
                        >
                            {submitting ? "Submitting..." : "🚀 Submit to Committee"}
                        </button>
                    )}
                </div>
            </div>

            {/* Committee revision remarks */}
            {budget.committee_remarks && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">
                        ⚠️ Committee Remarks (Revision #{budget.revision_count})
                    </p>
                    <p className="text-sm text-red-700">{budget.committee_remarks}</p>
                </div>
            )}

            {/* Cost breakdown */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <SectionTitle icon="💰" title="Cost Breakdown" />
                <InfoRow label="Compute Cost" value={formatINR(budget.compute_cost)} />
                <InfoRow label="Data Acquisition" value={formatINR(budget.data_acquisition_cost)} />
                <InfoRow label="Manpower" value={formatINR(budget.manpower_cost)} />
                <InfoRow label="Infrastructure" value={formatINR(budget.infrastructure_cost)} />
                <InfoRow label="Miscellaneous" value={formatINR(budget.miscellaneous_cost)} />
                <div className="flex items-center justify-between bg-purple-50 rounded-lg px-4 py-3 mt-3">
                    <span className="text-sm font-semibold text-purple-700">Total Budget</span>
                    <span className="text-xl font-bold text-purple-700">{formatINR(budget.total_budget)}</span>
                </div>
            </div>

            {/* Justification */}
            {budget.justification && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <SectionTitle icon="📝" title="Justification" />
                    <p className="text-sm text-gray-600 leading-relaxed">{budget.justification}</p>
                </div>
            )}

            {/* Documents */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <SectionTitle icon="📎" title="Supporting Documents" />
                <DocumentList
                    budgetId={budget.id}
                    canDelete={false}
                    refreshTrigger={0}
                />
            </div>

        </div>
    );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export default function ProjectBudgetTab({ project }) {

    const { user } = useAuth();
    const [budget, setBudget] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState("view");
    const [submitting, setSubmitting] = useState(false);

    const fetchBudget = async () => {
        try {
            setLoading(true);
            const res = await fetch(`http://127.0.0.1:8000/budget/project/${project.id}`);
            if (res.status === 404) setBudget(null);
            else setBudget(await res.json());
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBudget(); }, [project.id]);

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            const res = await fetch(`http://127.0.0.1:8000/budget/${budget.id}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ submitted_by: user?.user_id }),
            });
            if (!res.ok) { alert((await res.json()).detail); return; }
            await fetchBudget();
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <p className="text-center text-gray-400 py-10">Loading budget...</p>;

    // No budget yet
    if (!budget && mode !== "form") return (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-4xl mb-3">💰</p>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No Budget Proposal Yet</h3>
            <p className="text-sm text-gray-400 mb-6">
                Create a detailed budget proposal to submit to the committee.
            </p>
            <button
                onClick={() => setMode("form")}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition"
            >
                + Create Budget Proposal
            </button>
        </div>
    );

    if (mode === "form") return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700">
                    {budget ? "Edit Budget Proposal" : "Create Budget Proposal"}
                </h3>
                {budget && (
                    <button
                        onClick={() => setMode("view")}
                        className="text-sm text-gray-400 hover:text-gray-600"
                    >
                        ← Cancel
                    </button>
                )}
            </div>
            <BudgetForm
                projectId={project.id}
                existing={budget}
                userId={user?.user_id}
                onSaved={async () => { await fetchBudget(); setMode("view"); }}
            />
        </div>
    );

    return (
        <BudgetView
            budget={budget}
            onSubmit={handleSubmit}
            onEdit={() => setMode("form")}
            submitting={submitting}
        />
    );
}