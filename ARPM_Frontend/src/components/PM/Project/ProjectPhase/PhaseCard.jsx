import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { PHASE_STATUS_MAP, STEP_STATUS_MAP } from "./PhaseTab";
import StepCard from "./StepCard";

function Badge({ status, map }) {
    const s = map[status] || { label: status, cls: "bg-gray-100 text-gray-500" };
    return <span className={`px-2 py-1 text-xs rounded-full font-semibold ${s.cls}`}>{s.label}</span>;
}

export default function PhaseCard({
    phase, project, userRole,
    isExpanded, onToggle, onRefresh
}) {
    const { user } = useAuth();
    const isPM         = userRole === "pm";
    const isResearcher = userRole === "researcher";

    const [activating,  setActivating]  = useState(false);
    const [submitting,  setSubmitting]  = useState(false);
    const [reviewing,   setReviewing]   = useState(false);
    const [remarks,     setRemarks]     = useState("");
    const [showReview,  setShowReview]  = useState(false);
    const [actionError, setActionError] = useState("");

    const steps            = phase.steps || [];
    const completedSteps   = steps.filter(s => s.status === "reviewed").length;
    const allStepsReviewed = steps.length > 0 && completedSteps === steps.length;
    const stepPct          = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;

    // ── Phase Actions ─────────────────────────────────────────────────────────

    const handleActivate = async () => {
        setActivating(true); setActionError("");
        try {
            const res = await fetch(`http://127.0.0.1:8000/phases/${phase.id}/activate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ activated_by: user?.user_id }),
            });
            if (!res.ok) { setActionError((await res.json()).detail); return; }
            onRefresh();
        } finally { setActivating(false); }
    };

    const handleSubmitPhase = async () => {
        setSubmitting(true); setActionError("");
        try {
            const res = await fetch(`http://127.0.0.1:8000/phases/${phase.id}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ submitted_by: user?.user_id }),
            });
            if (!res.ok) { setActionError((await res.json()).detail); return; }
            onRefresh();
        } finally { setSubmitting(false); }
    };

    const handleReview = async (action) => {
        if (action === "revision_requested" && !remarks.trim()) {
            setActionError("Remarks are required when requesting revision."); return;
        }
        setReviewing(true); setActionError("");
        try {
            const res = await fetch(`http://127.0.0.1:8000/phases/${phase.id}/review`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reviewed_by: user?.user_id,
                    action,
                    pm_remarks: remarks || null,
                }),
            });
            if (!res.ok) { setActionError((await res.json()).detail); return; }
            setShowReview(false);
            onRefresh();
        } finally { setReviewing(false); }
    };

    // ── Border color by status ────────────────────────────────────────────────
    const borderCls = {
        not_started:        "border-gray-200",
        active:             "border-blue-300",
        submitted:          "border-yellow-300",
        revision_requested: "border-red-300",
        completed:          "border-green-300",
    }[phase.status] || "border-gray-200";

    return (
        <div className={`bg-white rounded-xl border-l-4 shadow-sm overflow-hidden ${borderCls}`}>

            {/* ── Card Header ── */}
            <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition"
                onClick={onToggle}
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Phase number circle */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        phase.status === "completed"
                            ? "bg-green-500 text-white"
                            : phase.status === "active"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-600"
                    }`}>
                        {phase.status === "completed" ? "✓" : phase.phase_number}
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-800">{phase.phase_name}</p>
                            <Badge status={phase.status} map={PHASE_STATUS_MAP} />
                            {phase.is_custom && (
                                <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-600 rounded-full">Custom</span>
                            )}
                            {(phase.iteration || 1) > 1 && (
                                <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                                    Iter {phase.iteration}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{phase.description}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 ml-4">
                    {/* Step progress */}
                    {steps.length > 0 && (
                        <div className="text-right">
                            <p className="text-xs text-gray-400">{completedSteps}/{steps.length} steps</p>
                            <div className="w-20 bg-gray-100 rounded-full h-1.5 mt-1">
                                <div className="bg-purple-500 h-1.5 rounded-full transition-all"
                                    style={{ width: `${stepPct}%` }} />
                            </div>
                        </div>
                    )}
                    {/* Revision count */}
                    {phase.revision_count > 0 && (
                        <span className="text-xs text-red-400">Rev #{phase.revision_count}</span>
                    )}
                    <span className="text-gray-400 text-sm">{isExpanded ? "▲" : "▼"}</span>
                </div>
            </div>

            {/* ── Expanded Body ── */}
            {isExpanded && (
                <div className="border-t border-gray-100 p-5 space-y-4">

                    {/* PM remarks (revision) */}
                    {phase.pm_remarks && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                            <p className="text-xs font-semibold text-red-500 uppercase mb-1">PM Remarks</p>
                            <p className="text-red-700">{phase.pm_remarks}</p>
                        </div>
                    )}

                    {/* ── Phase action buttons ── */}
                    <div className="flex flex-wrap gap-3 items-center">

                        {/* PM: Activate */}
                        {isPM && phase.status === "not_started" && (
                            <button
                                onClick={handleActivate}
                                disabled={activating}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-60"
                            >
                                {activating ? "Activating..." : "▶ Activate Phase"}
                            </button>
                        )}

                        {/* Researcher / PM: Submit phase */}
                        {(isResearcher || isPM) && phase.status === "active" && allStepsReviewed && (
                            <button
                                onClick={handleSubmitPhase}
                                disabled={submitting}
                                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold rounded-lg transition disabled:opacity-60"
                            >
                                {submitting ? "Submitting..." : "📤 Submit Phase to PM"}
                            </button>
                        )}

                        {/* PM: Review submitted phase */}
                        {isPM && phase.status === "submitted" && !showReview && (
                            <button
                                onClick={() => setShowReview(true)}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition"
                            >
                                🔍 Review Phase
                            </button>
                        )}

                        {actionError && (
                            <p className="text-red-500 text-xs">{actionError}</p>
                        )}
                    </div>

                    {/* PM Review panel */}
                    {showReview && (
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
                            <p className="text-sm font-semibold text-purple-700">Phase Review Decision</p>
                            <textarea
                                rows={3}
                                placeholder="Remarks (required for revision, optional for approval)..."
                                value={remarks}
                                onChange={e => { setRemarks(e.target.value); setActionError(""); }}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                            />
                            {actionError && <p className="text-red-500 text-xs">{actionError}</p>}
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => setShowReview(false)}
                                    className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
                                <button
                                    onClick={() => handleReview("revision_requested")}
                                    disabled={reviewing}
                                    className="px-4 py-2 border-2 border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg disabled:opacity-60 transition"
                                >
                                    ↩ Request Revision
                                </button>
                                <button
                                    onClick={() => handleReview("approved")}
                                    disabled={reviewing}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg disabled:opacity-60 transition"
                                >
                                    ✅ Approve Phase
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Steps ── */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                            Steps ({completedSteps}/{steps.length} complete)
                        </p>
                        {steps.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">No steps defined.</p>
                        ) : (
                            steps.map((step, idx) => {
                                const prevStep    = idx > 0 ? steps[idx - 1] : null;
                                const isLocked    = phase.status === "not_started" ||
                                    (prevStep && prevStep.status !== "reviewed");
                                return (
                                    <StepCard
                                        key={step.id}
                                        step={step}
                                        phase={phase}
                                        stepIndex={idx}
                                        isLocked={isLocked}
                                        userRole={userRole}
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
