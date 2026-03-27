import { useEffect, useState } from "react";

// ─── Status maps ──────────────────────────────────────────────────────────────
const PHASE_STATUS_MAP = {
    completed: { label: "Completed ✓", cls: "bg-green-100 text-green-700" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Badge({ status, map }) {
    const s = map[status] || { label: status, cls: "bg-gray-100 text-gray-500" };
    return <span className={`px-2 py-1 text-xs rounded-full font-semibold ${s.cls}`}>{s.label}</span>;
}

function SectionTitle({ title }) {
    return (
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide border-b pb-2 mb-3">
            {title}
        </p>
    );
}

// ─── Step Detail (read-only, only reviewed steps) ─────────────────────────────
function CommitteeStepCard({ step }) {
    const [expanded, setExpanded] = useState(false);

    // Committee only sees reviewed steps
    if (step.status !== "reviewed") return null;

    return (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-green-500 text-white shrink-0">
                        ✓
                    </div>
                    <p className="text-sm font-medium text-gray-700">{step.step_name}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 font-semibold">
                        Reviewed ✓
                    </span>
                    <span className="text-gray-400 text-xs">{expanded ? "▲" : "▼"}</span>
                </div>
            </div>

            {/* Expanded content */}
            {expanded && (
                <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50/30">

                    {step.description && (
                        <p className="text-xs text-gray-500 italic">{step.description}</p>
                    )}

                    {/* Step notes / content */}
                    {step.notes && (
                        <div>
                            <SectionTitle title="Step Content / Notes" />
                            <div className="bg-white border border-gray-100 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {step.notes}
                            </div>
                        </div>
                    )}

                    {/* Documents — read-only */}
                    {(step.documents || []).length > 0 && (
                        <div>
                            <SectionTitle title="Documents" />
                            <div className="space-y-1.5">
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
                                        <a href={doc.file_path} target="_blank" rel="noreferrer"
                                            className="text-purple-600 hover:underline font-medium">
                                            View ↗
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Review timestamp */}
                    {step.reviewed_at && (
                        <p className="text-xs text-gray-400">
                            ✅ Reviewed by PM on{" "}
                            {new Date(step.reviewed_at).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric"
                            })}
                        </p>
                    )}

                </div>
            )}
        </div>
    );
}

// ─── Phase Card (read-only, only completed phases) ────────────────────────────
function CommitteePhaseCard({ phase, isExpanded, onToggle }) {
    const steps = phase.steps || [];
    const reviewedSteps = steps.filter(s => s.status === "reviewed");
    const totalSteps = steps.length;

    return (
        <div className="bg-white rounded-xl border-l-4 border-green-300 shadow-sm overflow-hidden">

            {/* Header */}
            <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition"
                onClick={onToggle}
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Phase number circle */}
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-green-500 text-white">
                        ✓
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-800">{phase.phase_name}</p>
                            <Badge status="completed" map={PHASE_STATUS_MAP} />
                            {(phase.iteration || 1) > 1 && (
                                <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                                    Iter {phase.iteration}
                                </span>
                            )}
                            {phase.is_custom && (
                                <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-600 rounded-full">
                                    Custom
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{phase.description}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 ml-4">
                    <div className="text-right">
                        <p className="text-xs text-gray-400">{reviewedSteps.length}/{totalSteps} steps</p>
                        <div className="w-20 bg-gray-100 rounded-full h-1.5 mt-1">
                            <div className="bg-green-500 h-1.5 rounded-full"
                                style={{ width: totalSteps > 0 ? `${Math.round((reviewedSteps.length / totalSteps) * 100)}%` : "0%" }} />
                        </div>
                    </div>
                    {phase.completed_at && (
                        <p className="text-xs text-gray-400 hidden md:block">
                            {new Date(phase.completed_at).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric"
                            })}
                        </p>
                    )}
                    <span className="text-gray-400 text-sm">{isExpanded ? "▲" : "▼"}</span>
                </div>
            </div>

            {/* Expanded body */}
            {isExpanded && (
                <div className="border-t border-gray-100 p-5 space-y-4">

                    {/* PM approval note */}
                    {phase.pm_remarks && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-blue-500 uppercase mb-1">PM Remarks</p>
                            <p className="text-sm text-blue-700">{phase.pm_remarks}</p>
                        </div>
                    )}

                    {/* Steps — only reviewed ones visible */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between mb-2">
                            <SectionTitle title={`Steps (${reviewedSteps.length} PM-approved)`} />
                        </div>

                        {reviewedSteps.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">No reviewed steps yet.</p>
                        ) : (
                            reviewedSteps.map(step => (
                                <CommitteeStepCard key={step.id} step={step} />
                            ))
                        )}

                        {/* Show count of hidden non-reviewed steps */}
                        {steps.length > reviewedSteps.length && (
                            <p className="text-xs text-gray-400 italic pt-1">
                                {steps.length - reviewedSteps.length} step(s) not yet reviewed by PM are hidden.
                            </p>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────
export default function CommitteePhaseTab({ project }) {
    const [visibility, setVisibility] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedPhase, setExpandedPhase] = useState(null);

    const fetchPhases = async () => {
        setLoading(true); setError("");
        try {
            const res = await fetch(`http://127.0.0.1:8000/phases/project/${project.id}`);
            if (!res.ok) { setError("Failed to load phases"); return; }
            setVisibility(await res.json());
        } catch { setError("Network error."); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPhases(); }, [project.id]);

    if (loading) return <p className="text-center text-gray-400 py-10">Loading phases...</p>;

    if (error) return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 text-sm mb-3">{error}</p>
            <button onClick={fetchPhases} className="text-sm text-purple-600 hover:underline">↺ Retry</button>
        </div>
    );

    // If no tranche released yet
    if (!visibility?.visible) return (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-14 text-center">
            <p className="text-5xl mb-3">🔒</p>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Phases Not Started</h3>
            <p className="text-sm text-gray-400">
                No budget tranche has been released yet — phases have not begun.
            </p>
        </div>
    );

    // Committee only sees COMPLETED phases
    const allPhases = visibility.phases || [];
    const completedPhases = allPhases.filter(p => p.status === "completed");
    const totalPhases = allPhases.length;

    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="font-bold text-gray-800">Research Phases</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {completedPhases.length} of {totalPhases} phases completed and approved by PM
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                    <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: totalPhases > 0 ? `${Math.round((completedPhases.length / totalPhases) * 100)}%` : "0%" }}
                    />
                </div>
                <p className="text-xs text-gray-400 text-right">
                    {totalPhases > 0 ? Math.round((completedPhases.length / totalPhases) * 100) : 0}% complete
                </p>
            </div>

            {/* Committee notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                🏛️ You are viewing <strong>PM-approved completed phases only</strong>.
                Within each phase, only <strong>PM-reviewed steps</strong> with their content and documents are shown.
                In-progress work is not visible.
            </div>

            {/* Phase list */}
            {completedPhases.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
                    <p className="text-4xl mb-3">⏳</p>
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">No Completed Phases Yet</h3>
                    <p className="text-sm text-gray-400">
                        Phases will appear here once the PM approves them.
                        {totalPhases > 0 && ` (${totalPhases} phase(s) in progress)`}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {completedPhases.map(phase => (
                        <CommitteePhaseCard
                            key={phase.id}
                            phase={phase}
                            isExpanded={expandedPhase === phase.id}
                            onToggle={() =>
                                setExpandedPhase(expandedPhase === phase.id ? null : phase.id)
                            }
                        />
                    ))}
                </div>
            )}

            {/* Show in-progress count */}
            {totalPhases > completedPhases.length && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-center">
                    <p className="text-xs text-gray-500">
                        🔬 {totalPhases - completedPhases.length} phase(s) currently in progress —
                        visible to committee only after PM approval.
                    </p>
                </div>
            )}

        </div>
    );
}