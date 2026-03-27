import { useEffect, useState } from "react";
import { useAuth } from "../../../../components/context/AuthContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
    const map = {
        draft: { label: "Draft", cls: "bg-gray-100 text-gray-500" },
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

// ─── Document List (read-only) ────────────────────────────────────────────────

function DocumentList({ budgetId }) {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`http://127.0.0.1:8000/budget/${budgetId}/documents`)
            .then((r) => r.json())
            .then(setDocs)
            .finally(() => setLoading(false));
    }, [budgetId]);

    if (loading) return <p className="text-sm text-gray-400">Loading...</p>;

    if (!docs.length) return (
        <p className="text-sm text-gray-400 italic">No documents uploaded.</p>
    );

    return (
        <div className="space-y-2">
            {docs.map((doc) => (
                <div
                    key={doc.id}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-100"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-xl">📄</span>
                        <div>
                            <p className="text-sm font-medium text-gray-700">
                                {doc.document_title}
                            </p>
                            <p className="text-xs text-gray-400 capitalize">
                                {doc.document_type.replace(/_/g, " ")}
                            </p>
                        </div>
                    </div>
                    <a
                        href={doc.file_path}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-purple-600 hover:underline font-medium"
                    >
                        View ↗
                    </a>
                </div>
            ))}
        </div>
    );
}

// ─── Budget Detail (read-only) ────────────────────────────────────────────────

function BudgetDetail({ budget }) {
    return (
        <div className="space-y-4">

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
                    <span className="text-xl font-bold text-purple-700">
                        {formatINR(budget.total_budget)}
                    </span>
                </div>
            </div>

            {/* Justification */}
            {budget.justification && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <SectionTitle icon="📝" title="PM Justification" />
                    <p className="text-sm text-gray-600 leading-relaxed">
                        {budget.justification}
                    </p>
                </div>
            )}

            {/* Documents */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <SectionTitle icon="📎" title="Supporting Documents" />
                <DocumentList budgetId={budget.id} />
            </div>

            {/* Previous remarks */}
            {budget.committee_remarks && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">
                        📋 Previous Remarks (Revision #{budget.revision_count})
                    </p>
                    <p className="text-sm text-amber-800">{budget.committee_remarks}</p>
                </div>
            )}

        </div>
    );
}

// ─── Committee Action Panel ───────────────────────────────────────────────────

function CommitteeActionPanel({ budget, onActionDone }) {

    const { user } = useAuth();

    const [remarks, setRemarks] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleAction = async (action) => {
        if (action === "revision_requested" && !remarks.trim()) {
            setError("Remarks are required when requesting a revision.");
            return;
        }
        setError("");
        try {
            setSubmitting(true);
            const res = await fetch(
                `http://127.0.0.1:8000/budget/${budget.id}/review`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        reviewed_by: user?.user_id,
                        action,
                        committee_remarks: remarks.trim() || null,
                    }),
                }
            );
            if (!res.ok) {
                setError((await res.json()).detail || "Something went wrong.");
                return;
            }
            onActionDone();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border-2 border-purple-200 shadow-sm p-6">

            <SectionTitle icon="🏛️" title="Committee Decision" />

            <p className="text-sm text-gray-500 mb-5">
                Review the cost breakdown and documents above, then record your decision.
            </p>

            {/* Remarks */}
            <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks
                    <span className="text-gray-400 font-normal text-xs ml-2">
                        Required for revision · Optional for approval
                    </span>
                </label>
                <textarea
                    rows={4}
                    placeholder="Provide specific feedback or approval notes for the project manager..."
                    value={remarks}
                    onChange={(e) => { setRemarks(e.target.value); setError(""); }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                />
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>

            {/* Decision buttons */}
            <div className="flex gap-3 justify-end">
                <button
                    onClick={() => handleAction("revision_requested")}
                    disabled={submitting}
                    className="px-5 py-2.5 border-2 border-red-300 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-lg transition disabled:opacity-60"
                >
                    {submitting ? "..." : "↩️ Request Revision"}
                </button>
                <button
                    onClick={() => handleAction("approved")}
                    disabled={submitting}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-60"
                >
                    {submitting ? "..." : "✅ Approve Budget"}
                </button>
            </div>

        </div>
    );
}

// ─── Decision Result Banner ───────────────────────────────────────────────────

function DecisionBanner({ budget }) {
    const approved = budget.status === "approved";
    return (
        <div className={`rounded-xl border-2 p-5 ${approved
            ? "bg-green-50 border-green-300"
            : "bg-red-50 border-red-300"
            }`}>
            <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{approved ? "✅" : "↩️"}</span>
                <p className={`font-semibold text-base ${approved ? "text-green-700" : "text-red-600"
                    }`}>
                    {approved
                        ? "Budget Approved by Committee"
                        : "Revision Requested by Committee"}
                </p>
            </div>
            {budget.committee_remarks && (
                <p className="text-sm text-gray-600 ml-9">
                    {budget.committee_remarks}
                </p>
            )}
        </div>
    );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export default function CommitteeBudgetTab({ project }) {

    const [budget, setBudget] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchBudget = async () => {
        try {
            setLoading(true);
            const res = await fetch(
                `http://127.0.0.1:8000/budget/project/${project.id}`
            );
            if (res.status === 404) setBudget(null);
            else setBudget(await res.json());
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBudget(); }, [project.id]);

    // ── Loading ──
    if (loading) return (
        <p className="text-center text-gray-400 py-10">Loading budget...</p>
    );

    // ── No budget at all ──
    if (!budget) return (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-14 text-center">
            <p className="text-5xl mb-3">📭</p>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
                No Budget Created Yet
            </h3>
            <p className="text-sm text-gray-400">
                The project manager has not created a budget proposal for this project.
            </p>
        </div>
    );

    // ── Draft — PM hasn't submitted ──
    if (budget.status === "draft") return (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-14 text-center">
            <p className="text-5xl mb-3">⏳</p>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
                Budget Not Submitted Yet
            </h3>
            <p className="text-sm text-gray-400">
                The PM has saved a draft but has not submitted it for committee review.
            </p>
            <div className="mt-4 flex justify-center">
                <StatusBadge status="draft" />
            </div>
        </div>
    );

    // ── Submitted — show details + action panel ──
    if (budget.status === "submitted") return (
        <div className="space-y-5">

            {/* Status header */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-400 mb-1">Current Status</p>
                    <StatusBadge status={budget.status} />
                </div>
                {budget.submitted_at && (
                    <p className="text-xs text-gray-400">
                        Submitted on{" "}
                        {new Date(budget.submitted_at).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric"
                        })}
                    </p>
                )}
            </div>

            {/* Budget detail — read only */}
            <BudgetDetail budget={budget} />

            {/* Action panel */}
            <CommitteeActionPanel
                budget={budget}
                onActionDone={fetchBudget}
            />

        </div>
    );

    // ── Approved or Revision Requested — show result ──
    return (
        <div className="space-y-5">

            {/* Status header */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-400 mb-1">Current Status</p>
                    <StatusBadge status={budget.status} />
                </div>
                {budget.submitted_at && (
                    <p className="text-xs text-gray-400">
                        Submitted on{" "}
                        {new Date(budget.submitted_at).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric"
                        })}
                    </p>
                )}
            </div>

            {/* Decision banner at top */}
            <DecisionBanner budget={budget} />

            {/* Budget details below for reference */}
            <BudgetDetail budget={budget} />

        </div>
    );
}