import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";

const RELEASE_TYPES = [
    { value: "manual", label: "Manual" },
    { value: "milestone_based", label: "Milestone Based" },
    { value: "time_based", label: "Time Based" },
];
const CONDITION_TYPES = [
    { value: "manual", label: "Manual (Committee Action)" },
    { value: "phase_start", label: "Phase Start" },
    { value: "phase_completion", label: "Phase Completion" },
    { value: "date", label: "Specific Date" },
];
const TRANCHE_STATUSES = {
    pending: { label: "Pending", cls: "bg-gray-100 text-gray-500" },
    approved: { label: "Approved", cls: "bg-blue-100 text-blue-700" },
    released: { label: "Released", cls: "bg-green-100 text-green-700" },
    blocked: { label: "Blocked", cls: "bg-red-100 text-red-600" },
};
const PLAN_STATUSES = {
    draft: { label: "Draft", cls: "bg-gray-100 text-gray-600" },
    active: { label: "Active", cls: "bg-green-100 text-green-700" },
    locked: { label: "Locked", cls: "bg-blue-100 text-blue-700" },
    revised: { label: "Revised", cls: "bg-yellow-100 text-yellow-700" },
    archived: { label: "Archived", cls: "bg-red-100 text-red-500" },
};

function Badge({ status, map }) {
    const s = map[status] || { label: status, cls: "bg-gray-100 text-gray-500" };
    return <span className={`px-2 py-1 text-xs rounded-full font-semibold ${s.cls}`}>{s.label}</span>;
}
function SectionTitle({ icon, title }) {
    return (
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2 border-b pb-2 mb-4">
            <span>{icon}</span> {title}
        </h3>
    );
}
function formatINR(val) {
    if (val === null || val === undefined) return "—";
    return `₹ ${Number(val).toLocaleString("en-IN")}`;
}
const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300";
const selectCls = inputCls;

// ─── Release eligibility ──────────────────────────────────────────────────────
function getReleasableTrancheId(tranches, planStatus) {
    if (planStatus !== "active") return null;
    for (let i = 0; i < tranches.length; i++) {
        const t = tranches[i];
        if (t.status !== "pending") continue;
        if (t.has_dependency) {
            const prevAllReleased = tranches.slice(0, i).every(p => p.status === "released");
            if (!prevAllReleased) return null;
        }
        return t.id;
    }
    return null;
}

// ─── Summary Bar ──────────────────────────────────────────────────────────────
function SummaryBar({ plan, tranches }) {
    const sanctioned = Number(plan.total_sanctioned_amount) || 0;
    const allocated = Number(plan.total_allocated) || 0;

    // ✅ Compute released directly from tranches — most reliable source
    const released = tranches.reduce(
        (sum, t) => sum + (t.status === "released" ? Number(t.released_amount || t.amount || 0) : 0),
        0
    );

    const releasedPct = sanctioned > 0 ? Math.min(Math.round((released / sanctioned) * 100), 100) : 0;
    const allocatedPct = sanctioned > 0 ? Math.min(Math.round((allocated / sanctioned) * 100), 100) : 0;
    const releasedCount = tranches.filter(t => t.status === "released").length;

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-xs text-gray-400 mb-0.5">Release Plan v{plan.plan_version}</p>
                    <Badge status={plan.status} map={PLAN_STATUSES} />
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-400">Sanctioned Budget</p>
                    <p className="text-xl font-bold text-purple-700">{formatINR(sanctioned)}</p>
                </div>
            </div>

            {/* Progress label */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Fund Release Progress</span>
                <span>{releasedPct}% released · {releasedCount}/{tranches.length} tranches</span>
            </div>

            {/* Layered progress bar: allocated (purple) behind released (green) */}
            <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-1">
                <div
                    className="absolute top-0 left-0 h-3 rounded-full bg-purple-200 transition-all duration-500"
                    style={{ width: `${allocatedPct}%` }}
                />
                <div
                    className="absolute top-0 left-0 h-3 rounded-full bg-green-500 transition-all duration-500"
                    style={{ width: `${releasedPct}%` }}
                />
            </div>

            {/* Legend */}
            <div className="flex gap-4 text-xs text-gray-400 mb-4">
                <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-2 rounded-sm bg-green-500" /> Released
                </span>
                <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-2 rounded-sm bg-purple-200" /> Allocated
                </span>
                <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-2 rounded-sm bg-gray-100 border border-gray-200" /> Remaining
                </span>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-400 mb-0.5">Allocated</p>
                    <p className="font-bold text-gray-700 text-sm">{formatINR(allocated)}</p>
                    <p className="text-xs text-gray-400">{allocatedPct}%</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-400 mb-0.5">Released</p>
                    <p className="font-bold text-green-600 text-sm">{formatINR(released)}</p>
                    <p className="text-xs text-gray-400">{releasedPct}%</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-400 mb-0.5">Remaining</p>
                    <p className="font-bold text-blue-600 text-sm">{formatINR(sanctioned - released)}</p>
                    <p className="text-xs text-gray-400">{100 - releasedPct}%</p>
                </div>
            </div>

            {/* Tranche step indicators */}
            {tranches.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-2">Tranche Chain</p>
                    <div className="flex items-center flex-wrap gap-1">
                        {tranches.map((t, i) => (
                            <div key={t.id} className="flex items-center gap-1">
                                <div
                                    title={`${t.tranche_name} — ${formatINR(t.amount)}`}
                                    className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold cursor-default transition-all ${t.status === "released"
                                            ? "bg-green-500 text-white ring-2 ring-green-200"
                                            : "bg-gray-200 text-gray-500"
                                        }`}
                                >
                                    {t.status === "released" ? "✓" : i + 1}
                                </div>
                                {i < tranches.length - 1 && (
                                    <div className={`h-0.5 w-5 rounded transition-all ${t.status === "released" ? "bg-green-400" : "bg-gray-200"
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Add Tranche Form ─────────────────────────────────────────────────────────
function AddTrancheForm({ planId, sanctioned, allocated, onAdded, onCancel }) {
    const [form, setForm] = useState({
        tranche_name: "", description: "", amount: "",
        release_type: "manual", condition_type: "manual",
        condition_value: "", has_dependency: false,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const remaining = Number(sanctioned) - Number(allocated);

    const handleSave = async () => {
        if (!form.tranche_name.trim()) { setError("Tranche name is required."); return; }
        if (!form.amount || Number(form.amount) <= 0) { setError("Amount must be > 0."); return; }
        if (Number(form.amount) > remaining) { setError(`Max allowed: ${formatINR(remaining)}`); return; }
        setError("");
        try {
            setSaving(true);
            const res = await fetch(`http://127.0.0.1:8000/release-plan/${planId}/tranches`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, amount: Number(form.amount) }),
            });
            if (!res.ok) { setError((await res.json()).detail || "Save failed"); return; }
            onAdded();
        } finally { setSaving(false); }
    };

    return (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 mb-4">
            <h4 className="font-semibold text-purple-700 mb-4 text-sm">+ New Tranche</h4>
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label className="text-xs text-gray-500 mb-1 block">Tranche Name *</label>
                    <input className={inputCls} placeholder="e.g. Initial Release"
                        value={form.tranche_name} onChange={(e) => setForm({ ...form, tranche_name: e.target.value })} />
                </div>
                <div>
                    <label className="text-xs text-gray-500 mb-1 block">Amount (₹) * — max {formatINR(remaining)}</label>
                    <input type="number" min="0" className={inputCls} placeholder="0"
                        value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                    <label className="text-xs text-gray-500 mb-1 block">Release Type</label>
                    <select className={selectCls} value={form.release_type}
                        onChange={(e) => setForm({ ...form, release_type: e.target.value })}>
                        {RELEASE_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-gray-500 mb-1 block">Condition Type</label>
                    <select className={selectCls} value={form.condition_type}
                        onChange={(e) => setForm({ ...form, condition_type: e.target.value })}>
                        {CONDITION_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                </div>
                {form.condition_type !== "manual" && (
                    <div className="col-span-2">
                        <label className="text-xs text-gray-500 mb-1 block">
                            Condition Value {form.condition_type === "date" ? "(YYYY-MM-DD)" : "(Phase ID or event)"}
                        </label>
                        <input className={inputCls} placeholder="e.g. 2025-06-01"
                            value={form.condition_value} onChange={(e) => setForm({ ...form, condition_value: e.target.value })} />
                    </div>
                )}
                <div className="col-span-2">
                    <label className="text-xs text-gray-500 mb-1 block">Description</label>
                    <textarea rows={2} className={inputCls} placeholder="What is this tranche for?"
                        value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                    <input type="checkbox" id="dep" checked={form.has_dependency}
                        onChange={(e) => setForm({ ...form, has_dependency: e.target.checked })} />
                    <label htmlFor="dep" className="text-xs text-gray-600">
                        This tranche depends on a previous tranche being released first
                    </label>
                </div>
            </div>
            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
            <div className="flex gap-3 justify-end">
                <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                <button onClick={handleSave} disabled={saving}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-60">
                    {saving ? "Saving..." : "Save Tranche"}
                </button>
            </div>
        </div>
    );
}

// ─── Tranche Card ─────────────────────────────────────────────────────────────
function TrancheCard({ tranche, planStatus, isCommittee, isReleasable, isBlocked, onRelease, onDelete, onUploadDoc }) {
    const [showRelease, setShowRelease] = useState(false);
    const [releaseForm, setReleaseForm] = useState({
        released_amount: tranche.amount, transaction_reference: "", remarks: "",
    });
    const [releasing, setReleasing] = useState(false);
    const canDelete = isCommittee && planStatus === "draft" && tranche.status !== "released";

    return (
        <div className={`bg-white rounded-xl border shadow-sm p-5 transition ${tranche.status === "released" ? "border-green-200 bg-green-50/20"
                : isBlocked ? "border-yellow-200 bg-yellow-50/10"
                    : "border-gray-100"
            }`}>
            <div className="flex items-start justify-between mb-3">
                <div>
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-semibold text-gray-800">{tranche.tranche_name}</p>
                        <Badge status={tranche.status} map={TRANCHE_STATUSES} />
                        {isBlocked && (
                            <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full font-medium">
                                ⏳ Waiting for previous tranche
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-400">
                        {RELEASE_TYPES.find(r => r.value === tranche.release_type)?.label}
                        {" · "}
                        {CONDITION_TYPES.find(c => c.value === tranche.condition_type)?.label}
                        {tranche.condition_value ? ` → ${tranche.condition_value}` : ""}
                    </p>
                </div>
                <div className="text-right">
                    <p className={`text-lg font-bold ${isBlocked ? "text-gray-400" : "text-purple-700"}`}>
                        {formatINR(tranche.amount)}
                    </p>
                    {tranche.status === "released" && (
                        <p className="text-xs text-green-600">Released: {formatINR(tranche.released_amount)}</p>
                    )}
                </div>
            </div>

            {tranche.description && <p className="text-sm text-gray-500 mb-3">{tranche.description}</p>}

            {tranche.status === "released" && (
                <div className="bg-green-50 rounded-lg p-3 mb-3 text-xs text-green-700 space-y-0.5">
                    <p>📅 Released: {new Date(tranche.release_date).toLocaleDateString("en-IN")}</p>
                    {tranche.transaction_reference && <p>🔖 Ref: {tranche.transaction_reference}</p>}
                    {tranche.remarks && <p>💬 {tranche.remarks}</p>}
                </div>
            )}

            <div className="flex gap-3 mb-3 text-xs">
                {tranche.tranche_justification_doc_url ? (
                    <a href={tranche.tranche_justification_doc_url} target="_blank" rel="noreferrer"
                        className="text-purple-600 hover:underline">📄 Justification ↗</a>
                ) : isCommittee ? (
                    <button onClick={() => onUploadDoc(tranche.id, "justification")}
                        className="text-gray-400 hover:text-purple-500">+ Justification Doc</button>
                ) : null}
                {tranche.release_approval_doc_url ? (
                    <a href={tranche.release_approval_doc_url} target="_blank" rel="noreferrer"
                        className="text-purple-600 hover:underline">📄 Approval Doc ↗</a>
                ) : isCommittee ? (
                    <button onClick={() => onUploadDoc(tranche.id, "approval")}
                        className="text-gray-400 hover:text-purple-500">+ Approval Doc</button>
                ) : null}
            </div>

            <div className="flex gap-3 items-center flex-wrap">
                {isReleasable && !showRelease && (
                    <button onClick={() => setShowRelease(true)}
                        className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition">
                        🚀 Release Funds
                    </button>
                )}
                {canDelete && (
                    <button onClick={() => onDelete(tranche.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition">Delete</button>
                )}
                {tranche.has_dependency && tranche.status !== "released" && (
                    <span className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                        ⛓ Has dependency
                    </span>
                )}
            </div>

            {showRelease && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                    <p className="text-xs font-semibold text-green-700 mb-2">Confirm Fund Release</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Amount (₹) — max {formatINR(tranche.amount)}</label>
                            <input type="number" className={inputCls} value={releaseForm.released_amount}
                                onChange={(e) => setReleaseForm({ ...releaseForm, released_amount: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Transaction Reference</label>
                            <input className={inputCls} placeholder="e.g. TXN123456" value={releaseForm.transaction_reference}
                                onChange={(e) => setReleaseForm({ ...releaseForm, transaction_reference: e.target.value })} />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-gray-500 mb-1 block">Remarks (optional)</label>
                            <textarea rows={2} className={inputCls} placeholder="Notes..."
                                value={releaseForm.remarks}
                                onChange={(e) => setReleaseForm({ ...releaseForm, remarks: e.target.value })} />
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button onClick={() => setShowRelease(false)} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
                        <button
                            disabled={releasing}
                            onClick={async () => {
                                try { setReleasing(true); await onRelease(tranche.id, releaseForm); setShowRelease(false); }
                                finally { setReleasing(false); }
                            }}
                            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition">
                            {releasing ? "Releasing..." : "✅ Confirm Release"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Doc Upload Modal ─────────────────────────────────────────────────────────
function DocUploadModal({ trancheId, docType, userId, onDone }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const handleUpload = async () => {
        if (!file) { alert("Pick a file first"); return; }
        const fd = new FormData();
        fd.append("uploaded_by", userId);
        fd.append("doc_type", docType);
        fd.append("file", file);
        try {
            setUploading(true);
            await fetch(`http://127.0.0.1:8000/release-plan/tranches/${trancheId}/upload`, { method: "POST", body: fd });
            onDone();
        } finally { setUploading(false); }
    };
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-[420px] shadow-xl">
                <h3 className="font-semibold text-gray-800 mb-4">
                    Upload {docType === "justification" ? "Justification" : "Approval"} Document
                </h3>
                <label className="flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-500 hover:border-purple-400 mb-4">
                    <span>📁</span><span>{file ? file.name : "Choose file"}</span>
                    <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0] || null)} />
                </label>
                <div className="flex gap-3 justify-end">
                    <button onClick={onDone} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
                    <button onClick={handleUpload} disabled={uploading}
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg disabled:opacity-60 transition">
                        {uploading ? "Uploading..." : "⬆️ Upload"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────
export default function ReleasePlanTab({ project, userRole = "committee" }) {
    const { user } = useAuth();
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [budgetOk, setBudgetOk] = useState(false);
    const [creating, setCreating] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [activating, setActivating] = useState(false);
    const [uploadModal, setUploadModal] = useState(null);
    const [error, setError] = useState("");
    const isCommittee = userRole === "committee";

    const fetchPlan = async () => {
        setLoading(true); setError("");
        try {
            const bRes = await fetch(`http://127.0.0.1:8000/budget/project/${project.id}`);
            if (!bRes.ok) { setBudgetOk(false); setPlan(null); return; }
            const bData = await bRes.json();
            if (bData.status !== "approved") { setBudgetOk(false); setPlan(null); return; }
            setBudgetOk(true);
            const res = await fetch(`http://127.0.0.1:8000/release-plan/project/${project.id}`);
            if (res.status === 404) { setPlan(null); return; }
            if (!res.ok) { setError((await res.json()).detail || "Failed to load"); return; }
            const data = await res.json();
            data.tranches = data.tranches || [];
            setPlan(data);
        } catch { setError("Network error."); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPlan(); }, [project.id]);

    const handleCreatePlan = async () => {
        setCreating(true); setError("");
        try {
            const bRes = await fetch(`http://127.0.0.1:8000/budget/project/${project.id}`);
            const bData = await bRes.json();
            const res = await fetch("http://127.0.0.1:8000/release-plan/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    project_id: project.id, created_by: user?.user_id,
                    total_sanctioned_amount: bData.total_budget, currency: "INR"
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                if (err.detail?.includes("already exists")) { await fetchPlan(); return; }
                setError(err.detail || "Failed"); return;
            }
            const created = await res.json();
            created.tranches = created.tranches || [];
            setPlan(created);
        } finally { setCreating(false); }
    };

    const handleActivate = async () => {
        setActivating(true);
        try {
            const res = await fetch(`http://127.0.0.1:8000/release-plan/${plan.id}/activate`, { method: "POST" });
            if (!res.ok) { alert((await res.json()).detail); return; }
            await fetchPlan();
        } finally { setActivating(false); }
    };

    const handleRelease = async (trancheId, form) => {
        const res = await fetch(`http://127.0.0.1:8000/release-plan/tranches/${trancheId}/release`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, released_by: user?.user_id }),
        });
        if (!res.ok) { alert((await res.json()).detail); return; }
        await fetchPlan();
    };

    const handleDelete = async (trancheId) => {
        if (!confirm("Delete this tranche?")) return;
        const res = await fetch(`http://127.0.0.1:8000/release-plan/tranches/${trancheId}`, { method: "DELETE" });
        if (!res.ok) { alert((await res.json()).detail); return; }
        await fetchPlan();
    };

    if (loading) return <p className="text-center text-gray-400 py-10">Loading release plan...</p>;
    if (error) return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 text-sm mb-3">{error}</p>
            <button onClick={fetchPlan} className="text-sm text-purple-600 hover:underline">↺ Retry</button>
        </div>
    );
    if (!budgetOk) return (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-14 text-center">
            <p className="text-5xl mb-3">🔒</p>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Budget Not Approved Yet</h3>
            <p className="text-sm text-gray-400">Release Plan is available only after budget is approved.</p>
        </div>
    );
    if (!plan) return (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-14 text-center">
            <p className="text-5xl mb-3">📋</p>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No Release Plan Created</h3>
            <p className="text-sm text-gray-400 mb-6">Create a release plan to define how budget is distributed over time.</p>
            {isCommittee && (
                <button onClick={handleCreatePlan} disabled={creating}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-60">
                    {creating ? "Creating..." : "+ Create Release Plan"}
                </button>
            )}
        </div>
    );

    const tranches = plan.tranches || [];
    const canAddTranche = isCommittee && plan.status === "draft";
    const canActivate = isCommittee && plan.status === "draft" && tranches.length > 0;
    const releasableId = isCommittee ? getReleasableTrancheId(tranches, plan.status) : null;
    const blockedIds = new Set(
        tranches.filter((t, i) => {
            if (t.status === "released" || !t.has_dependency) return false;
            return !tranches.slice(0, i).every(p => p.status === "released");
        }).map(t => t.id)
    );

    return (
        <div className="space-y-4">
            {/* ✅ Pass tranches directly so SummaryBar computes from source of truth */}
            <SummaryBar plan={plan} tranches={tranches} />

            {isCommittee && (canActivate || canAddTranche) && (
                <div className="flex gap-3 justify-end">
                    {canActivate && (
                        <button onClick={handleActivate} disabled={activating}
                            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-60">
                            {activating ? "Activating..." : "✅ Activate Plan"}
                        </button>
                    )}
                    {canAddTranche && (
                        <button onClick={() => setShowAdd(true)}
                            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition">
                            + Add Tranche
                        </button>
                    )}
                </div>
            )}

            {showAdd && (
                <AddTrancheForm planId={plan.id} sanctioned={plan.total_sanctioned_amount}
                    allocated={plan.total_allocated || 0}
                    onAdded={async () => { await fetchPlan(); setShowAdd(false); }}
                    onCancel={() => setShowAdd(false)} />
            )}

            <div>
                <SectionTitle icon="📦" title={`Tranches (${tranches.length})`} />
                {tranches.length === 0 ? (
                    <p className="text-sm text-gray-400 italic py-4 text-center">No tranches yet.</p>
                ) : (
                    <div className="space-y-3">
                        {tranches.map(t => (
                            <TrancheCard key={t.id} tranche={t} planStatus={plan.status}
                                isCommittee={isCommittee}
                                isReleasable={t.id === releasableId}
                                isBlocked={blockedIds.has(t.id)}
                                onRelease={handleRelease} onDelete={handleDelete}
                                onUploadDoc={(tid, dt) => setUploadModal({ trancheId: tid, docType: dt })} />
                        ))}
                    </div>
                )}
            </div>

            {plan.notes && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <p className="text-xs text-gray-400 mb-1">Plan Notes</p>
                    <p className="text-sm text-gray-600">{plan.notes}</p>
                </div>
            )}

            {uploadModal && (
                <DocUploadModal trancheId={uploadModal.trancheId} docType={uploadModal.docType}
                    userId={user?.user_id}
                    onDone={async () => { setUploadModal(null); await fetchPlan(); }} />
            )}
        </div>
    );
}