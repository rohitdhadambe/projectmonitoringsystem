import { useState } from "react";

// Predefined phase templates PM can pick from
const PHASE_TEMPLATES = [
    {
        label: "Problem & Literature",
        phase_name: "Problem & Literature",
        description: "Define problem, review literature, identify gaps and baselines.",
        steps: [
            "Define Problem",
            "Add Papers",
            "Identify Research Gap",
            "Define Baselines",
            "Define Success Metrics",
        ],
    },
    {
        label: "Hypothesis & Planning",
        phase_name: "Hypothesis & Planning",
        description: "Form hypotheses, design experiments, plan resources.",
        steps: [
            "Form Hypotheses",
            "Design Experiments",
            "Data Collection Plan",
            "Resource & Timeline Plan",
        ],
    },
    {
        label: "Experimentation",
        phase_name: "Experimentation",
        description: "Execute experiments, train models, log results.",
        steps: [
            "Data Preprocessing",
            "Model Development",
            "Training & Iteration",
            "Results Logging",
        ],
    },
    {
        label: "Evaluation & Analysis",
        phase_name: "Evaluation & Analysis",
        description: "Compare results with baselines, analyse errors.",
        steps: [
            "Evaluate Against Baselines",
            "Error Analysis",
            "Document Findings",
        ],
    },
    {
        label: "Reporting & Deployment",
        phase_name: "Reporting & Deployment",
        description: "Write final report, deploy, handover.",
        steps: ["Final Report", "Deployment Artifacts", "Handover & Closure"],
    },
    {
        label: "🔧 Custom Phase",
        phase_name: "",
        description: "",
        steps: [],
    },
];

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300";

export default function CreatePhaseModal({ projectId, existingPhases, userId, onClose, onCreated }) {

    const [selected, setSelected] = useState(null);   // template index
    const [phaseName, setPhaseName] = useState("");
    const [description, setDescription] = useState("");
    const [steps, setSteps] = useState([{ step_name: "", description: "" }]);
    const [isIteration, setIsIteration] = useState(false);
    const [iterOf, setIterOf] = useState("");     // phase name being iterated
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleSelectTemplate = (idx) => {
        const tpl = PHASE_TEMPLATES[idx];
        setSelected(idx);
        setPhaseName(tpl.phase_name);
        setDescription(tpl.description);
        setSteps(
            tpl.steps.length > 0
                ? tpl.steps.map(s => ({ step_name: s, description: "" }))
                : [{ step_name: "", description: "" }]
        );
    };

    const addStep = () =>
        setSteps(prev => [...prev, { step_name: "", description: "" }]);

    const removeStep = (i) =>
        setSteps(prev => prev.filter((_, idx) => idx !== i));

    const updateStep = (i, key, val) =>
        setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, [key]: val } : s));

    const handleCreate = async () => {
        if (!phaseName.trim()) { setError("Phase name is required."); return; }
        if (steps.some(s => !s.step_name.trim())) { setError("All steps need a name."); return; }
        setError("");

        const nextPhaseNumber = existingPhases.length + 1;
        // Determine iteration
        let iteration = 1;
        if (isIteration && iterOf) {
            const matching = existingPhases.filter(p =>
                p.phase_name === iterOf || p.phase_name.startsWith(iterOf)
            );
            iteration = matching.length + 1;
        }

        try {
            setSaving(true);
            const res = await fetch(`http://127.0.0.1:8000/phases/project/${projectId}/custom`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phase_name: isIteration ? `${phaseName} (Iter ${iteration})` : phaseName,
                    description,
                    phase_number: nextPhaseNumber,
                    iteration,
                    is_custom: true,
                    created_by: userId,
                    steps: steps.map((s, i) => ({
                        step_number: i + 1,
                        step_name: s.step_name,
                        description: s.description,
                    })),
                }),
            });
            if (!res.ok) { setError((await res.json()).detail || "Failed"); return; }
            onCreated();
        } finally { setSaving(false); }
    };

    // Unique phase names for iteration picker
    const uniquePhaseNames = [...new Set(existingPhases.map(p =>
        p.phase_name.replace(/ \(Iter \d+\)$/, "")
    ))];

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b">
                    <div>
                        <h2 className="font-bold text-gray-800">Add Phase</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Choose a template or create a custom phase
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                </div>

                <div className="p-5 space-y-5">

                    {/* ── Template picker ── */}
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Phase Template</p>
                        <div className="grid grid-cols-2 gap-2">
                            {PHASE_TEMPLATES.map((tpl, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSelectTemplate(i)}
                                    className={`text-left px-3 py-2.5 rounded-lg border text-sm transition ${selected === i
                                            ? "border-purple-500 bg-purple-50 text-purple-700 font-medium"
                                            : "border-gray-200 text-gray-600 hover:border-purple-300"
                                        }`}
                                >
                                    {tpl.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Iteration toggle ── */}
                    <div className="flex items-center gap-3 bg-purple-50 rounded-lg px-4 py-3">
                        <input
                            type="checkbox"
                            id="iter"
                            checked={isIteration}
                            onChange={e => setIsIteration(e.target.checked)}
                        />
                        <label htmlFor="iter" className="text-sm text-purple-700 font-medium cursor-pointer">
                            🔄 This is a repeat iteration of an existing phase
                        </label>
                    </div>

                    {isIteration && (
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Iterating which phase?</label>
                            <select
                                className={inputCls}
                                value={iterOf}
                                onChange={e => setIterOf(e.target.value)}
                            >
                                <option value="">— Select phase —</option>
                                {uniquePhaseNames.map((name, i) => (
                                    <option key={i} value={name}>{name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-400 mt-1">
                                The iteration number will be appended automatically.
                            </p>
                        </div>
                    )}

                    {/* ── Phase name & description ── */}
                    <div className="grid grid-cols-1 gap-3">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Phase Name *</label>
                            <input
                                className={inputCls}
                                placeholder="e.g. Experimentation"
                                value={phaseName}
                                onChange={e => setPhaseName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Description</label>
                            <textarea
                                rows={2}
                                className={inputCls + " resize-none"}
                                placeholder="What is the goal of this phase?"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* ── Steps editor ── */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-gray-400 uppercase">Steps</p>
                            <button
                                onClick={addStep}
                                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                            >
                                + Add Step
                            </button>
                        </div>
                        <div className="space-y-2">
                            {steps.map((step, i) => (
                                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                                    <div className="col-span-1 flex items-center justify-center h-9">
                                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">
                                            {i + 1}
                                        </span>
                                    </div>
                                    <div className="col-span-9 space-y-1">
                                        <input
                                            className={inputCls}
                                            placeholder={`Step ${i + 1} name`}
                                            value={step.step_name}
                                            onChange={e => updateStep(i, "step_name", e.target.value)}
                                        />
                                        <input
                                            className={inputCls + " text-xs"}
                                            placeholder="Brief description (optional)"
                                            value={step.description}
                                            onChange={e => updateStep(i, "description", e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-2 flex items-center justify-end gap-1 h-9">
                                        {/* Move up/down */}
                                        {i > 0 && (
                                            <button onClick={() => {
                                                const arr = [...steps];
                                                [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
                                                setSteps(arr);
                                            }} className="text-gray-300 hover:text-gray-500 text-xs">↑</button>
                                        )}
                                        {i < steps.length - 1 && (
                                            <button onClick={() => {
                                                const arr = [...steps];
                                                [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
                                                setSteps(arr);
                                            }} className="text-gray-300 hover:text-gray-500 text-xs">↓</button>
                                        )}
                                        {steps.length > 1 && (
                                            <button onClick={() => removeStep(i)}
                                                className="text-red-300 hover:text-red-500 text-xs ml-1">✕</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-xs">{error}</p>}

                    {/* ── Footer ── */}
                    <div className="flex gap-3 justify-end pt-2 border-t">
                        <button onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={saving}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg disabled:opacity-60 transition"
                        >
                            {saving ? "Creating..." : "✅ Create Phase"}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
