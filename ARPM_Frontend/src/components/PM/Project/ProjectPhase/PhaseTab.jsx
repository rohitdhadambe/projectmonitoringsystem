import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import PhaseCard from "./PhaseCard";
import CreatePhaseModal from "./CreatePhaseModal";

// ─── Status maps ──────────────────────────────────────────────────────────────
export const PHASE_STATUS_MAP = {
    not_started:        { label: "Not Started",        cls: "bg-gray-100 text-gray-500"    },
    active:             { label: "Active",             cls: "bg-blue-100 text-blue-700"    },
    submitted:          { label: "Submitted",          cls: "bg-yellow-100 text-yellow-700"},
    revision_requested: { label: "Revision Requested", cls: "bg-red-100 text-red-600"      },
    completed:          { label: "Completed ✓",        cls: "bg-green-100 text-green-700"  },
};

export const STEP_STATUS_MAP = {
    not_started:  { label: "Not Started",  cls: "bg-gray-100 text-gray-400"    },
    draft:        { label: "Draft",        cls: "bg-gray-100 text-gray-600"    },
    in_progress:  { label: "In Progress",  cls: "bg-blue-100 text-blue-700"    },
    submitted:    { label: "Submitted",    cls: "bg-yellow-100 text-yellow-700"},
    reviewed:     { label: "Reviewed ✓",   cls: "bg-green-100 text-green-700"  },
};

function Badge({ status, map }) {
    const s = map[status] || { label: status, cls: "bg-gray-100 text-gray-500" };
    return (
        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${s.cls}`}>
            {s.label}
        </span>
    );
}

// ─── Phase Locked State ───────────────────────────────────────────────────────
function PhaseLockedState({ reason }) {
    return (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-14 text-center">
            <p className="text-5xl mb-3">🔒</p>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Phases Not Available Yet</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">{reason}</p>
        </div>
    );
}

// ─── Phase Iteration Badge ────────────────────────────────────────────────────
function IterationBadge({ iteration }) {
    if (iteration <= 1) return null;
    return (
        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full font-medium">
            Iteration {iteration}
        </span>
    );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────
export default function PhaseTab({ project, userRole = "pm" }) {
    const { user } = useAuth();

    const [visibility,      setVisibility]      = useState(null);
    const [loading,         setLoading]         = useState(true);
    const [error,           setError]           = useState("");
    const [expandedPhase,   setExpandedPhase]   = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeFilter,    setActiveFilter]    = useState("all");

    const isPM         = userRole === "pm";
    const isCommittee  = userRole === "committee";
    const isResearcher = userRole === "researcher";

    const fetchPhases = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`http://127.0.0.1:8000/phases/project/${project.id}`);
            if (!res.ok) { setError("Failed to load phases"); return; }
            const data = await res.json();
            setVisibility(data);
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

    if (!visibility?.visible) {
        return <PhaseLockedState reason={visibility?.reason || "No budget tranche released yet."} />;
    }

    // Committee only sees completed phases
    const phases = isCommittee
        ? (visibility.phases || []).filter(p => p.status === "completed")
        : (visibility.phases || []);

    // Filter
    const filtered = activeFilter === "all"
        ? phases
        : phases.filter(p => p.status === activeFilter);

    // Group by iteration for display
    const byIteration = {};
    phases.forEach(p => {
        const iter = p.iteration || 1;
        if (!byIteration[iter]) byIteration[iter] = [];
        byIteration[iter].push(p);
    });

    const iterations = Object.keys(byIteration).map(Number).sort();

    const totalPhases     = phases.length;
    const completedPhases = phases.filter(p => p.status === "completed").length;
    const activePhase     = phases.find(p => p.status === "active");

    return (
        <div className="space-y-5">

            {/* ── Header bar ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="font-bold text-gray-800">Research Phases</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {visibility.tranche_released_count} tranche(s) released ·{" "}
                            {completedPhases}/{totalPhases} phases completed
                        </p>
                    </div>
                    <div className="flex gap-3 items-center">
                        {/* ✅ PM can add custom phases */}
                        {isPM && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition"
                            >
                                + Add Phase
                            </button>
                        )}
                    </div>
                </div>

                {/* Overall progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                    <div
                        className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: totalPhases > 0 ? `${Math.round((completedPhases / totalPhases) * 100)}%` : "0%" }}
                    />
                </div>
                <p className="text-xs text-gray-400 text-right">
                    {totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0}% complete
                </p>

                {/* Filter tabs */}
                {!isCommittee && (
                    <div className="flex gap-2 mt-4 flex-wrap">
                        {["all", "not_started", "active", "submitted", "revision_requested", "completed"].map(f => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`px-3 py-1 text-xs rounded-full transition ${
                                    activeFilter === f
                                        ? "bg-purple-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                {f === "all" ? "All" : PHASE_STATUS_MAP[f]?.label || f}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Committee notice */}
            {isCommittee && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                    🏛️ You are viewing only <strong>PM-approved completed phases</strong>. In-progress work is not shown.
                </div>
            )}

            {/* ── Phase list grouped by iteration ── */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
                    <p className="text-gray-400 text-sm">
                        {activeFilter === "all"
                            ? isCommittee
                                ? "No phases have been approved yet."
                                : "No phases yet."
                            : `No phases with status "${PHASE_STATUS_MAP[activeFilter]?.label}".`}
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {iterations.map(iter => {
                        const iterPhases = filtered.filter(p => (p.iteration || 1) === iter);
                        if (iterPhases.length === 0) return null;
                        return (
                            <div key={iter}>
                                {/* Iteration header */}
                                {iterations.length > 1 && (
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-px flex-grow bg-gray-200" />
                                        <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                                            🔄 Iteration {iter}
                                        </span>
                                        <div className="h-px flex-grow bg-gray-200" />
                                    </div>
                                )}
                                <div className="space-y-3">
                                    {iterPhases.map(phase => (
                                        <PhaseCard
                                            key={phase.id}
                                            phase={phase}
                                            project={project}
                                            userRole={userRole}
                                            isExpanded={expandedPhase === phase.id}
                                            onToggle={() =>
                                                setExpandedPhase(
                                                    expandedPhase === phase.id ? null : phase.id
                                                )
                                            }
                                            onRefresh={fetchPhases}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Phase Modal */}
            {showCreateModal && (
                <CreatePhaseModal
                    projectId={project.id}
                    existingPhases={phases}
                    userId={user?.user_id}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => { setShowCreateModal(false); fetchPhases(); }}
                />
            )}

        </div>
    );
}
