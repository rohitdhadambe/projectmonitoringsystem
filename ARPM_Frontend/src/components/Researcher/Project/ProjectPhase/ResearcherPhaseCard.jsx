import { useState } from "react";
import { useAuth } from "../../../../components/context/AuthContext";
import { PHASE_STATUS_MAP, STEP_STATUS_MAP } from "./ResearcherPhaseTab";
import ResearcherStepCard from "./ResearcherStepCard";

function Badge({ status, map }) {
    const s = map[status] || { label: status, cls: "bg-gray-100 text-gray-500" };
    return <span className={`px-2 py-1 text-xs rounded-full font-semibold ${s.cls}`}>{s.label}</span>;
}

export default function ResearcherPhaseCard({
    phase, project, isExpanded, onToggle, onRefresh
}) {
    const { user }     = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [error,      setError]      = useState("");

    const steps          = phase.steps || [];
    const completedSteps = steps.filter(s => s.status === "reviewed").length;
    const allReviewed    = steps.length > 0 && completedSteps === steps.length;
    const stepPct        = steps.length > 0
        ? Math.round((completedSteps / steps.length) * 100) : 0;

    // Researcher can submit phase when all steps reviewed and phase is active
    const canSubmit = phase.status === "active" && allReviewed;
    // Also allow resubmit after revision
    const canResubmit = phase.status === "revision_requested" && allReviewed;

    const handleSubmitPhase = async () => {
        setSubmitting(true); setError("");
        try {
            const res = await fetch(`http://127.0.0.1:8000/phases/${phase.id}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ submitted_by: user?.user_id }),
            });
            if (!res.ok) { setError((await res.json()).detail); return; }
            onRefresh();
        } finally { setSubmitting(false); }
    };

    // Border color by status
    const borderCls = {
        not_started:        "border-gray-200",
        active:             "border-blue-300",
        submitted:          "border-yellow-300",
        revision_requested: "border-red-300",
        completed:          "border-green-300",
    }[phase.status] || "border-gray-200";

    // Not started phases are collapsed and dimmed
    const isNotStarted = phase.status === "not_started";

    return (
        <div className={`bg-white rounded-xl border-l-4 shadow-sm overflow-hidden ${borderCls} ${
            isNotStarted ? "opacity-60" : ""
        }`}>

            {/* Header */}
            <div
                className={`flex items-center justify-between p-5 ${
                    isNotStarted ? "cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"
                } transition`}
                onClick={() => !isNotStarted && onToggle()}
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Phase circle */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        phase.status === "completed"
                            ? "bg-green-500 text-white"
                            : phase.status === "active"
                            ? "bg-blue-500 text-white"
                            : phase.status === "revision_requested"
                            ? "bg-red-400 text-white"
                            : "bg-gray-200 text-gray-400"
                    }`}>
                        {phase.status === "completed" ? "✓"
                            : isNotStarted ? "⏳"
                            : phase.phase_number}
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-800">{phase.phase_name}</p>
                            <Badge status={phase.status} map={PHASE_STATUS_MAP} />
                            {phase.revision_count > 0 && (
                                <span className="text-xs text-red-400">Rev #{phase.revision_count}</span>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {isNotStarted
                                ? "Waiting for PM to activate"
                                : phase.description}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 ml-4">
                    {!isNotStarted && steps.length > 0 && (
                        <div className="text-right">
                            <p className="text-xs text-gray-400">{completedSteps}/{steps.length} steps</p>
                            <div className="w-20 bg-gray-100 rounded-full h-1.5 mt-1">
                                <div className="bg-purple-500 h-1.5 rounded-full transition-all"
                                    style={{ width: `${stepPct}%` }} />
                            </div>
                        </div>
                    )}
                    {!isNotStarted && (
                        <span className="text-gray-400 text-sm">{isExpanded ? "▲" : "▼"}</span>
                    )}
                </div>
            </div>

            {/* Expanded body */}
            {isExpanded && !isNotStarted && (
                <div className="border-t border-gray-100 p-5 space-y-4">

                    {/* PM revision remarks */}
                    {phase.pm_remarks && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-red-500 uppercase mb-1">
                                PM Remarks — Please revise
                            </p>
                            <p className="text-sm text-red-700">{phase.pm_remarks}</p>
                        </div>
                    )}

                    {/* Submitted notice */}
                    {phase.status === "submitted" && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-yellow-700">
                                📤 Phase submitted to PM for review. Waiting for approval.
                            </p>
                        </div>
                    )}

                    {/* Completed notice */}
                    {phase.status === "completed" && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-sm text-green-700">
                                ✅ Phase approved by PM and completed.
                            </p>
                        </div>
                    )}

                    {/* Submit phase button */}
                    {(canSubmit || canResubmit) && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSubmitPhase}
                                disabled={submitting}
                                className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold rounded-lg transition disabled:opacity-60"
                            >
                                {submitting
                                    ? "Submitting..."
                                    : canResubmit
                                    ? "📤 Resubmit to PM"
                                    : "📤 Submit Phase to PM"}
                            </button>
                            {error && <p className="text-red-500 text-xs">{error}</p>}
                        </div>
                    )}

                    {/* Progress hint when not all steps done */}
                    {phase.status === "active" && !allReviewed && (
                        <p className="text-xs text-gray-400">
                            Complete all {steps.length} steps before submitting the phase to PM.
                            ({completedSteps} of {steps.length} reviewed)
                        </p>
                    )}

                    {/* Steps */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                            Steps ({completedSteps}/{steps.length} complete)
                        </p>
                        {steps.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">No steps defined.</p>
                        ) : (
                            steps.map((step, idx) => {
                                const prevStep = idx > 0 ? steps[idx - 1] : null;
                                const isLocked = phase.status === "not_started" ||
                                    (prevStep && prevStep.status !== "reviewed");
                                return (
                                    <ResearcherStepCard
                                        key={step.id}
                                        step={step}
                                        phase={phase}
                                        stepIndex={idx}
                                        isLocked={isLocked}
                                        onRefresh={onRefresh}
                                    />
                                );
                            })
                        )}
                    </div>

                </div>
            )}
        </div>
    );
}
