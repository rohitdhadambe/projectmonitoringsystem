import { useEffect, useState } from "react";

const PLAN_STATUSES = {
    draft:    { label: "Draft",    cls: "bg-gray-100 text-gray-600"   },
    active:   { label: "Active",   cls: "bg-green-100 text-green-700" },
    locked:   { label: "Locked",   cls: "bg-blue-100 text-blue-700"   },
    archived: { label: "Archived", cls: "bg-red-100 text-red-500"     },
};

const TRANCHE_STATUSES = {
    pending:  { label: "Pending",  cls: "bg-gray-100 text-gray-500"   },
    approved: { label: "Approved", cls: "bg-blue-100 text-blue-700"   },
    released: { label: "Released", cls: "bg-green-100 text-green-700" },
    blocked:  { label: "Blocked",  cls: "bg-red-100 text-red-600"     },
};

function Badge({ status, map }) {
    const s = map[status] || { label: status, cls: "bg-gray-100 text-gray-500" };
    return <span className={`px-2 py-1 text-xs rounded-full font-semibold ${s.cls}`}>{s.label}</span>;
}

function formatINR(val) {
    if (!val && val !== 0) return "—";
    return `₹ ${Number(val).toLocaleString("en-IN")}`;
}

export default function ResearcherReleasePlanView({ projectId }) {
    const [plan,    setPlan]    = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchPlan(); }, [projectId]);

    const fetchPlan = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://127.0.0.1:8000/release-plan/project/${projectId}`);
            if (res.status === 404) { setPlan(null); return; }
            if (res.ok) {
                const data = await res.json();
                data.tranches = data.tranches || [];
                setPlan(data);
            }
        } finally { setLoading(false); }
    };

    if (loading) return <p className="text-center text-gray-400 py-10">Loading release plan...</p>;

    if (!plan) return (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-14 text-center">
            <p className="text-4xl mb-3">📋</p>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No Release Plan Yet</h3>
            <p className="text-sm text-gray-400">
                The committee creates the release plan after approving the budget.
            </p>
        </div>
    );

    const tranches      = plan.tranches || [];
    const released      = tranches.reduce((s, t) =>
        s + (t.status === "released" ? Number(t.released_amount || t.amount || 0) : 0), 0);
    const sanctioned    = Number(plan.total_sanctioned_amount) || 0;
    const releasedPct   = sanctioned > 0 ? Math.min(Math.round((released / sanctioned) * 100), 100) : 0;
    const releasedCount = tranches.filter(t => t.status === "released").length;

    return (
        <div className="space-y-4">

            {/* Summary */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
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

                <div className="text-xs text-gray-500 flex justify-between mb-1">
                    <span>Fund Release Progress</span>
                    <span>{releasedPct}% · {releasedCount}/{tranches.length} tranches</span>
                </div>
                <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
                    <div className="absolute top-0 left-0 h-3 rounded-full bg-green-500 transition-all duration-500"
                        style={{ width: `${releasedPct}%` }} />
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-400 mb-0.5">Allocated</p>
                        <p className="font-bold text-gray-700 text-sm">
                            {formatINR(tranches.reduce((s, t) => s + Number(t.amount || 0), 0))}
                        </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-400 mb-0.5">Released</p>
                        <p className="font-bold text-green-600 text-sm">{formatINR(released)}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-400 mb-0.5">Remaining</p>
                        <p className="font-bold text-blue-600 text-sm">{formatINR(sanctioned - released)}</p>
                    </div>
                </div>

                {/* Tranche chain steps */}
                {tranches.length > 0 && (
                    <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-400 mb-2">Tranche Chain</p>
                        <div className="flex items-center flex-wrap gap-1">
                            {tranches.map((t, i) => (
                                <div key={t.id} className="flex items-center gap-1">
                                    <div
                                        title={`${t.tranche_name} — ${formatINR(t.amount)}`}
                                        className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                            t.status === "released"
                                                ? "bg-green-500 text-white ring-2 ring-green-200"
                                                : "bg-gray-200 text-gray-500"
                                        }`}
                                    >
                                        {t.status === "released" ? "✓" : i + 1}
                                    </div>
                                    {i < tranches.length - 1 && (
                                        <div className={`h-0.5 w-5 rounded ${
                                            t.status === "released" ? "bg-green-400" : "bg-gray-200"
                                        }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Tranche list */}
            <div className="space-y-2">
                {tranches.map((t) => (
                    <div key={t.id}
                        className={`bg-white rounded-xl border shadow-sm p-4 ${
                            t.status === "released" ? "border-green-200" : "border-gray-100"
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <p className="font-medium text-gray-800 text-sm">{t.tranche_name}</p>
                                    <Badge status={t.status} map={TRANCHE_STATUSES} />
                                </div>
                                <p className="text-xs text-gray-400">
                                    {t.release_type?.replace(/_/g, " ")} · {t.condition_type?.replace(/_/g, " ")}
                                    {t.condition_value ? ` → ${t.condition_value}` : ""}
                                </p>
                                {t.description && (
                                    <p className="text-xs text-gray-500 mt-1">{t.description}</p>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-purple-700">{formatINR(t.amount)}</p>
                                {t.status === "released" && (
                                    <p className="text-xs text-green-600 mt-0.5">
                                        Released: {formatINR(t.released_amount)}
                                    </p>
                                )}
                            </div>
                        </div>

                        {t.status === "released" && (
                            <div className="mt-2 bg-green-50 rounded-lg p-2 text-xs text-green-700 space-y-0.5">
                                <p>📅 {new Date(t.release_date).toLocaleDateString("en-IN", {
                                    day: "numeric", month: "short", year: "numeric"
                                })}</p>
                                {t.transaction_reference && <p>🔖 Ref: {t.transaction_reference}</p>}
                                {t.remarks && <p>💬 {t.remarks}</p>}
                            </div>
                        )}

                        {t.has_dependency && t.status !== "released" && (
                            <p className="text-xs text-yellow-600 mt-2">⛓ Waiting for previous tranche</p>
                        )}
                    </div>
                ))}
            </div>

        </div>
    );
}
