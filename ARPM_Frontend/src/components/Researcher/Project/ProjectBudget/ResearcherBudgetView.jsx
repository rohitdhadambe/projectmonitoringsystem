import { useEffect, useState } from "react";

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

function StatusBadge({ status }) {
    const map = {
        draft:              { label: "Draft",              cls: "bg-gray-100 text-gray-600"   },
        submitted:          { label: "Submitted",          cls: "bg-blue-100 text-blue-700"   },
        approved:           { label: "Approved ✓",         cls: "bg-green-100 text-green-700" },
        revision_requested: { label: "Revision Requested", cls: "bg-red-100 text-red-600"     },
    };
    const s = map[status] || { label: status, cls: "bg-gray-100 text-gray-500" };
    return (
        <span className={`px-3 py-1 text-sm rounded-full font-semibold ${s.cls}`}>
            {s.label}
        </span>
    );
}

function formatINR(val) {
    if (!val && val !== 0) return "—";
    return `₹ ${Number(val).toLocaleString("en-IN")}`;
}

export default function ResearcherBudgetView({ projectId }) {
    const [budget,  setBudget]  = useState(null);
    const [docs,    setDocs]    = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchBudget(); }, [projectId]);

    const fetchBudget = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://127.0.0.1:8000/budget/project/${projectId}`);
            if (res.status === 404) { setBudget(null); return; }
            const data = await res.json();
            setBudget(data);
            const dRes = await fetch(`http://127.0.0.1:8000/budget/${data.id}/documents`);
            if (dRes.ok) setDocs(await dRes.json());
        } finally { setLoading(false); }
    };

    if (loading) return <p className="text-center text-gray-400 py-10">Loading budget...</p>;

    if (!budget) return (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-14 text-center">
            <p className="text-4xl mb-3">📋</p>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No Budget Created Yet</h3>
            <p className="text-sm text-gray-400">
                The Project Manager will create and submit the budget proposal.
            </p>
        </div>
    );

    return (
        <div className="space-y-4">

            {/* Status bar */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-400 mb-1">Budget Status</p>
                    <StatusBadge status={budget.status} />
                </div>
                {budget.submitted_at && (
                    <p className="text-xs text-gray-400">
                        Submitted: {new Date(budget.submitted_at).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric"
                        })}
                    </p>
                )}
            </div>

            {/* Committee remarks */}
            {budget.committee_remarks && (
                <div className={`rounded-xl border p-4 ${
                    budget.status === "approved"
                        ? "bg-green-50 border-green-200"
                        : "bg-yellow-50 border-yellow-200"
                }`}>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                        Committee Remarks
                    </p>
                    <p className="text-sm text-gray-700">{budget.committee_remarks}</p>
                    {budget.revision_count > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                            Revision #{budget.revision_count}
                        </p>
                    )}
                </div>
            )}

            {/* Cost breakdown */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <SectionTitle icon="💰" title="Cost Breakdown" />
                <InfoRow label="Compute Cost"       value={formatINR(budget.compute_cost)} />
                <InfoRow label="Data Acquisition"   value={formatINR(budget.data_acquisition_cost)} />
                <InfoRow label="Manpower"           value={formatINR(budget.manpower_cost)} />
                <InfoRow label="Infrastructure"     value={formatINR(budget.infrastructure_cost)} />
                <InfoRow label="Miscellaneous"      value={formatINR(budget.miscellaneous_cost)} />
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
                    <SectionTitle icon="📝" title="Justification" />
                    <p className="text-sm text-gray-600 leading-relaxed">{budget.justification}</p>
                </div>
            )}

            {/* Supporting Documents */}
            {docs.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <SectionTitle icon="📎" title="Supporting Documents" />
                    <div className="space-y-2">
                        {docs.map(doc => (
                            <div key={doc.id}
                                className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">📄</span>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">{doc.document_title}</p>
                                        <p className="text-xs text-gray-400 capitalize">
                                            {doc.document_type?.replace(/_/g, " ")}
                                        </p>
                                    </div>
                                </div>
                                <a href={doc.file_path} target="_blank" rel="noreferrer"
                                    className="text-xs text-purple-600 hover:underline font-medium">
                                    View ↗
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
