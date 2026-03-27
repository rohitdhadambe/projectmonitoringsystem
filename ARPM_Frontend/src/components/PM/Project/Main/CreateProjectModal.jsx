import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import TopNavBar from "../../../../layout/TopNavBar";
import SideNavBarInvestigator from "../../SideNavBar/SideNavBar";

// ─── Reusable Field Components ────────────────────────────────────────────────

function SectionCard({ title, icon, children }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-purple-700 mb-4 flex items-center gap-2">
                <span>{icon}</span> {title}
            </h2>
            <div className="space-y-4">{children}</div>
        </div>
    );
}

function Field({ label, hint, children }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>
            {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
            {children}
        </div>
    );
}

const inputCls =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 transition";

const textareaCls =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 transition resize-none";

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CreateProjectPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [proposals, setProposals] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // ── Form State ──────────────────────────────────────────────────────────
    const [basic, setBasic] = useState({
        proposal_id: "",
        title: "",
        description: "",
    });

    const [researchPlan, setResearchPlan] = useState({
        objectives: "",
        expected_deliverables: "",
    });

    const [techDesign, setTechDesign] = useState({
        ai_approach: "",
        models: "",
        tools_frameworks: "",
        deployment_strategy: "",
    });

    const [dataStrategy, setDataStrategy] = useState({
        data_sources: "",
        data_collection_method: "",
        data_preprocessing: "",
        data_risks: "",
    });

    const [resourcePlan, setResourcePlan] = useState({
        team_size: "",
        roles: "",
        compute_resources: "",
        infrastructure: "",
    });

    const [timeline, setTimeline] = useState({
        estimated_duration_months: "",
        major_milestones: "",
    });

    const [riskMgmt, setRiskMgmt] = useState({
        technical_risks: "",
        operational_risks: "",
        mitigation_strategies: "",
    });

    // ── Load eligible proposals ─────────────────────────────────────────────
    useEffect(() => {
        if (!user?.user_id) return;
        fetch(`http://127.0.0.1:8000/projects/eligible-proposals/${user.user_id}`)
            .then((r) => r.json())
            .then(setProposals)
            .catch(console.error);
    }, [user]);

    // ── Helpers ─────────────────────────────────────────────────────────────
    const toArray = (str) =>
        str
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);

    const toNumber = (str) => (str ? Number(str) : 0);

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!basic.proposal_id) {
            alert("Please select a proposal.");
            return;
        }
        if (!basic.title.trim()) {
            alert("Project title is required.");
            return;
        }

        const project_details = {
            research_plan: {
                objectives: toArray(researchPlan.objectives),
                expected_deliverables: toArray(researchPlan.expected_deliverables),
            },
            technical_design: {
                ai_approach: techDesign.ai_approach,
                models: toArray(techDesign.models),
                tools_frameworks: toArray(techDesign.tools_frameworks),
                deployment_strategy: techDesign.deployment_strategy,
            },
            data_strategy: {
                data_sources: toArray(dataStrategy.data_sources),
                data_collection_method: dataStrategy.data_collection_method,
                data_preprocessing: dataStrategy.data_preprocessing,
                data_risks: toArray(dataStrategy.data_risks),
            },
            resource_plan: {
                team_size: toNumber(resourcePlan.team_size),
                roles: toArray(resourcePlan.roles),
                compute_resources: resourcePlan.compute_resources,
                infrastructure: resourcePlan.infrastructure,
            },
            timeline: {
                estimated_duration_months: toNumber(
                    timeline.estimated_duration_months
                ),
                major_milestones: toArray(timeline.major_milestones),
            },
            risk_management: {
                technical_risks: toArray(riskMgmt.technical_risks),
                operational_risks: toArray(riskMgmt.operational_risks),
                mitigation_strategies: toArray(riskMgmt.mitigation_strategies),
            },
        };

        const payload = {
            proposal_id: Number(basic.proposal_id),
            project_manager_id: user.user_id,
            title: basic.title,
            description: basic.description,
            project_details,
        };

        try {
            setSubmitting(true);
            const res = await fetch("http://127.0.0.1:8000/projects/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.detail || "Something went wrong.");
                return;
            }

            alert("✅ Project created successfully!");
            navigate("/manager/home");
        } catch (e) {
            alert("Network error. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div>
            <TopNavBar />

            <div className="min-h-screen flex bg-gray-100 pt-20">
                <SideNavBarInvestigator />

                <div className="flex-grow ml-80 p-6 max-w-5xl">

                    {/* ── Page Header ── */}
                    <div className="flex items-center gap-3 mb-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-gray-500 hover:text-purple-600 transition text-lg"
                            title="Go back"
                        >
                            ← Back
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                Create New Project
                            </h1>
                            <p className="text-sm text-gray-500">
                                Fill in all sections to set up your AI R&D project
                            </p>
                        </div>
                    </div>

                    <div className="space-y-5">

                        {/* ─── 1. Basic Info ─── */}
                        <SectionCard title="Basic Information" icon="📋">
                            <Field label="Proposal *" hint="Only approved proposals not yet linked to a project are shown.">
                                <select
                                    className={inputCls}
                                    value={basic.proposal_id}
                                    onChange={(e) =>
                                        setBasic({ ...basic, proposal_id: e.target.value })
                                    }
                                >
                                    <option value="">— Select Proposal —</option>
                                    {proposals.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            #{p.id} — {p.title}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Project Title *">
                                <input
                                    className={inputCls}
                                    placeholder="e.g. Autonomous Defect Detection System"
                                    value={basic.title}
                                    onChange={(e) =>
                                        setBasic({ ...basic, title: e.target.value })
                                    }
                                />
                            </Field>

                            <Field label="Description">
                                <textarea
                                    className={textareaCls}
                                    rows={3}
                                    placeholder="Brief overview of the project..."
                                    value={basic.description}
                                    onChange={(e) =>
                                        setBasic({ ...basic, description: e.target.value })
                                    }
                                />
                            </Field>
                        </SectionCard>

                        {/* ─── 2. Research Plan ─── */}
                        <SectionCard title="Research Plan" icon="🔬">
                            <Field
                                label="Objectives"
                                hint="One per line — each line becomes a separate objective."
                            >
                                <textarea
                                    className={textareaCls}
                                    rows={4}
                                    placeholder={"Define ML pipeline\nOptimize model accuracy\nDeploy production API"}
                                    value={researchPlan.objectives}
                                    onChange={(e) =>
                                        setResearchPlan({
                                            ...researchPlan,
                                            objectives: e.target.value,
                                        })
                                    }
                                />
                            </Field>

                            <Field
                                label="Expected Deliverables"
                                hint="One per line."
                            >
                                <textarea
                                    className={textareaCls}
                                    rows={3}
                                    placeholder={"Trained model\nDeployment API\nTechnical report"}
                                    value={researchPlan.expected_deliverables}
                                    onChange={(e) =>
                                        setResearchPlan({
                                            ...researchPlan,
                                            expected_deliverables: e.target.value,
                                        })
                                    }
                                />
                            </Field>
                        </SectionCard>

                        {/* ─── 3. Technical Design ─── */}
                        <SectionCard title="Technical Design" icon="⚙️">
                            <Field label="AI Approach">
                                <select
                                    className={inputCls}
                                    value={techDesign.ai_approach}
                                    onChange={(e) =>
                                        setTechDesign({
                                            ...techDesign,
                                            ai_approach: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">— Select AI Approach —</option>
                                    <option>Deep Learning</option>
                                    <option>Reinforcement Learning</option>
                                    <option>Natural Language Processing</option>
                                    <option>Computer Vision</option>
                                    <option>Classical ML</option>
                                    <option>Hybrid / Multi-modal</option>
                                </select>
                            </Field>

                            <Field
                                label="Models"
                                hint="One per line — e.g. CNN, Transformer, BERT"
                            >
                                <textarea
                                    className={textareaCls}
                                    rows={3}
                                    placeholder={"CNN\nTransformer\nBERT"}
                                    value={techDesign.models}
                                    onChange={(e) =>
                                        setTechDesign({
                                            ...techDesign,
                                            models: e.target.value,
                                        })
                                    }
                                />
                            </Field>

                            <Field
                                label="Tools & Frameworks"
                                hint="One per line — e.g. PyTorch, TensorFlow, FastAPI"
                            >
                                <textarea
                                    className={textareaCls}
                                    rows={3}
                                    placeholder={"PyTorch\nTensorFlow\nFastAPI"}
                                    value={techDesign.tools_frameworks}
                                    onChange={(e) =>
                                        setTechDesign({
                                            ...techDesign,
                                            tools_frameworks: e.target.value,
                                        })
                                    }
                                />
                            </Field>

                            <Field label="Deployment Strategy">
                                <select
                                    className={inputCls}
                                    value={techDesign.deployment_strategy}
                                    onChange={(e) =>
                                        setTechDesign({
                                            ...techDesign,
                                            deployment_strategy: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">— Select Strategy —</option>
                                    <option>Cloud</option>
                                    <option>Edge</option>
                                    <option>Hybrid</option>
                                    <option>On-Premise</option>
                                </select>
                            </Field>
                        </SectionCard>

                        {/* ─── 4. Data Strategy ─── */}
                        <SectionCard title="Data Strategy" icon="🗄️">
                            <Field label="Data Sources" hint="One per line.">
                                <textarea
                                    className={textareaCls}
                                    rows={3}
                                    placeholder={"IoT sensors\nPublic datasets\nInternal logs"}
                                    value={dataStrategy.data_sources}
                                    onChange={(e) =>
                                        setDataStrategy({
                                            ...dataStrategy,
                                            data_sources: e.target.value,
                                        })
                                    }
                                />
                            </Field>

                            <Field label="Data Collection Method">
                                <input
                                    className={inputCls}
                                    placeholder="e.g. Real-time streaming, batch ingestion"
                                    value={dataStrategy.data_collection_method}
                                    onChange={(e) =>
                                        setDataStrategy({
                                            ...dataStrategy,
                                            data_collection_method: e.target.value,
                                        })
                                    }
                                />
                            </Field>

                            <Field label="Data Preprocessing">
                                <input
                                    className={inputCls}
                                    placeholder="e.g. Cleaning, normalization, augmentation"
                                    value={dataStrategy.data_preprocessing}
                                    onChange={(e) =>
                                        setDataStrategy({
                                            ...dataStrategy,
                                            data_preprocessing: e.target.value,
                                        })
                                    }
                                />
                            </Field>

                            <Field label="Data Risks" hint="One per line.">
                                <textarea
                                    className={textareaCls}
                                    rows={2}
                                    placeholder={"Missing data\nBias in dataset"}
                                    value={dataStrategy.data_risks}
                                    onChange={(e) =>
                                        setDataStrategy({
                                            ...dataStrategy,
                                            data_risks: e.target.value,
                                        })
                                    }
                                />
                            </Field>
                        </SectionCard>

                        {/* ─── 5. Resource Planning ─── */}
                        <SectionCard title="Resource Planning" icon="👥">
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Team Size">
                                    <input
                                        type="number"
                                        min="1"
                                        className={inputCls}
                                        placeholder="e.g. 5"
                                        value={resourcePlan.team_size}
                                        onChange={(e) =>
                                            setResourcePlan({
                                                ...resourcePlan,
                                                team_size: e.target.value,
                                            })
                                        }
                                    />
                                </Field>

                                <Field label="Compute Resources">
                                    <input
                                        className={inputCls}
                                        placeholder="e.g. GPU cluster / AWS p3"
                                        value={resourcePlan.compute_resources}
                                        onChange={(e) =>
                                            setResourcePlan({
                                                ...resourcePlan,
                                                compute_resources: e.target.value,
                                            })
                                        }
                                    />
                                </Field>
                            </div>

                            <Field label="Roles" hint="One per line.">
                                <textarea
                                    className={textareaCls}
                                    rows={3}
                                    placeholder={"ML Engineer\nBackend Developer\nData Scientist"}
                                    value={resourcePlan.roles}
                                    onChange={(e) =>
                                        setResourcePlan({
                                            ...resourcePlan,
                                            roles: e.target.value,
                                        })
                                    }
                                />
                            </Field>

                            <Field label="Infrastructure">
                                <input
                                    className={inputCls}
                                    placeholder="e.g. IoT devices, cloud infra, on-prem servers"
                                    value={resourcePlan.infrastructure}
                                    onChange={(e) =>
                                        setResourcePlan({
                                            ...resourcePlan,
                                            infrastructure: e.target.value,
                                        })
                                    }
                                />
                            </Field>
                        </SectionCard>

                        {/* ─── 6. Timeline ─── */}
                        <SectionCard title="Timeline" icon="📅">
                            <Field label="Estimated Duration (months)">
                                <input
                                    type="number"
                                    min="1"
                                    className={inputCls}
                                    placeholder="e.g. 12"
                                    value={timeline.estimated_duration_months}
                                    onChange={(e) =>
                                        setTimeline({
                                            ...timeline,
                                            estimated_duration_months: e.target.value,
                                        })
                                    }
                                />
                            </Field>

                            <Field
                                label="Major Milestones"
                                hint="One per line — listed in order."
                            >
                                <textarea
                                    className={textareaCls}
                                    rows={4}
                                    placeholder={
                                        "Data Collection\nModel Training\nEvaluation\nDeployment"
                                    }
                                    value={timeline.major_milestones}
                                    onChange={(e) =>
                                        setTimeline({
                                            ...timeline,
                                            major_milestones: e.target.value,
                                        })
                                    }
                                />
                            </Field>
                        </SectionCard>

                        {/* ─── 7. Risk Management ─── */}
                        <SectionCard title="Risk Management" icon="⚠️">
                            <Field label="Technical Risks" hint="One per line.">
                                <textarea
                                    className={textareaCls}
                                    rows={3}
                                    placeholder={"Model overfitting\nData pipeline failures"}
                                    value={riskMgmt.technical_risks}
                                    onChange={(e) =>
                                        setRiskMgmt({
                                            ...riskMgmt,
                                            technical_risks: e.target.value,
                                        })
                                    }
                                />
                            </Field>

                            <Field label="Operational Risks" hint="One per line.">
                                <textarea
                                    className={textareaCls}
                                    rows={3}
                                    placeholder={"Hardware failure\nTeam availability"}
                                    value={riskMgmt.operational_risks}
                                    onChange={(e) =>
                                        setRiskMgmt({
                                            ...riskMgmt,
                                            operational_risks: e.target.value,
                                        })
                                    }
                                />
                            </Field>

                            <Field label="Mitigation Strategies" hint="One per line.">
                                <textarea
                                    className={textareaCls}
                                    rows={3}
                                    placeholder={"Regular validation checks\nBackup compute instances"}
                                    value={riskMgmt.mitigation_strategies}
                                    onChange={(e) =>
                                        setRiskMgmt({
                                            ...riskMgmt,
                                            mitigation_strategies: e.target.value,
                                        })
                                    }
                                />
                            </Field>
                        </SectionCard>

                        {/* ─── Submit Bar ─── */}
                        <div className="flex justify-end gap-3 pb-10">
                            <button
                                onClick={() => navigate(-1)}
                                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm transition"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition disabled:opacity-60"
                            >
                                {submitting ? "Creating..." : "🚀 Create Project"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}