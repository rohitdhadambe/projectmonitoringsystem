import { useEffect, useState } from "react";
import ResearcherPhaseCard from "./ResearcherPhaseCard";

// ── Status maps (shared) ──────────────────────────────────────────────────────
export const PHASE_STATUS_MAP = {
    not_started:        { label: "Not Started",        cls: "bg-gray-100 text-gray-500"    },
    active:             { label: "Active",             cls: "bg-blue-100 text-blue-700"    },
    submitted:          { label: "Submitted",          cls: "bg-yellow-100 text-yellow-700"},
    revision_requested: { label: "Revision Requested", cls: "bg-red-100 text-red-600"      },
    completed:          { label: "Completed ✓",        cls: "bg-green-100 text-green-700"  },
};

export const STEP_STATUS_MAP = {
    not_started: { label: "Not Started", cls: "bg-gray-100 text-gray-400"    },
    draft:       { label: "Draft",       cls: "bg-gray-100 text-gray-600"    },
    in_progress: { label: "In Progress", cls: "bg-blue-100 text-blue-700"    },
    submitted:   { label: "Submitted",   cls: "bg-yellow-100 text-yellow-700"},
    reviewed:    { label: "Reviewed ✓",  cls: "bg-green-100 text-green-700"  },
};

// ── Locked state ──────────────────────────────────────────────────────────────
function PhaseLockedState() {
    return (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-14 text-center">
            <p className="text-5xl mb-3">🔒</p>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Phases Not Available Yet</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
                Phases will appear here once the committee releases the initial budget tranche
                and the Project Manager activates a phase.
            </p>
        </div>
    );
}

// ── Main Tab ──────────────────────────────────────────────────────────────────
export default function ResearcherPhaseTab({ project, onRefresh }) {

    const [visibility,    setVisibility]    = useState(null);
    const [loading,       setLoading]       = useState(true);
    const [error,         setError]         = useState("");
    const [expandedPhase, setExpandedPhase] = useState(null);

    const fetchPhases = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`http://127.0.0.1:8000/phases/project/${project.id}`);
            if (!res.ok) { setError("Failed to load phases"); return; }
            const data = await res.json();
            setVisibility(data);

            // Auto-expand the first active phase
            if (data.phases) {
                const activePhase = data.phases.find(p =>
                    p.status === "active" || p.status === "revision_requested"
                );
                if (activePhase) setExpandedPhase(activePhase.id);
            }
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

    if (!visibility?.visible) return <PhaseLockedState />;

    const phases = visibility.phases || [];

    // Researcher only sees phases that are active or beyond (not not_started)
    // not_started phases are shown as locked/upcoming to give context
    const completedCount = phases.filter(p => p.status === "completed").length;
    const totalCount     = phases.length;

    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="font-bold text-gray-800">Research Phases</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Work on your assigned steps — submit each step when complete
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400">Progress</p>
                        <p className="text-sm font-bold text-purple-700">
                            {completedCount}/{totalCount} phases
                        </p>
                    </div>
                </div>

                {/* Overall progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                        className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: totalCount > 0 ? `${Math.round((completedCount / totalCount) * 100)}%` : "0%" }}
                    />
                </div>
            </div>

            {/* Info notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                🔬 You can work on steps in <strong>active phases</strong>.
                Complete each step, upload required documents, then submit the phase to your PM for review.
            </div>

            {/* Phase list */}
            {phases.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
                    <p className="text-gray-400 text-sm">
                        No phases yet. The Project Manager will activate phases when ready.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {phases.map(phase => (
                        <ResearcherPhaseCard
                            key={phase.id}
                            phase={phase}
                            project={project}
                            isExpanded={expandedPhase === phase.id}
                            onToggle={() =>
                                setExpandedPhase(expandedPhase === phase.id ? null : phase.id)
                            }
                            onRefresh={fetchPhases}
                        />
                    ))}
                </div>
            )}

        </div>
    );
}
