import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SideNavBarInvestigator from "../SideNavBar/SideNavBar";
import TopNavBar from "../../../layout/TopNavBar";
import { useAuth } from "../../../components/context/AuthContext";
import useResearcherProjects from "../../../hooks/Useresearcherprojects";

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const styles = {
        active: "bg-green-100 text-green-700",
        on_hold: "bg-yellow-100 text-yellow-700",
        completed: "bg-blue-100 text-blue-700",
    };
    return (
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${styles[status] || "bg-gray-100 text-gray-600"}`}>
            {status?.replace("_", " ")}
        </span>
    );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────
function Chip({ label }) {
    return (
        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
            {label}
        </span>
    );
}

// ─── Detail Block ─────────────────────────────────────────────────────────────
function DetailBlock({ title, children }) {
    return (
        <div>
            <p className="font-semibold text-gray-700 mb-1">{title}</p>
            {children}
        </div>
    );
}

// ─── Project Row ──────────────────────────────────────────────────────────────
function ProjectRow({ project }) {
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(false);
    const d = project.project_details || {};

    return (
        <>
            {/* Main row — click to navigate */}
            <tr
                onClick={() => navigate(`/researcher/project/${project.id}`)}
                className="border-b hover:bg-purple-50 transition cursor-pointer group"
            >
                <td className="p-3 font-medium text-purple-700 group-hover:text-purple-900">
                    {project.title}
                </td>

                <td className="p-3">
                    <StatusBadge status={project.status} />
                </td>

                <td className="p-3 text-sm text-gray-600">
                    {d.technical_design?.ai_approach || "—"}
                </td>

                <td className="p-3 text-sm text-gray-600">
                    <div className="flex flex-wrap gap-1">
                        {d.technical_design?.models?.slice(0, 2).map((m, i) => (
                            <Chip key={i} label={m} />
                        )) || "—"}
                    </div>
                </td>

                <td className="p-3 text-sm text-gray-600">
                    {d.timeline?.estimated_duration_months
                        ? `${d.timeline.estimated_duration_months} months`
                        : "—"}
                </td>

                {/* Expand — stopPropagation so row click doesn't fire */}
                <td className="p-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                        className="text-sm text-purple-600 hover:underline font-medium"
                    >
                        {expanded ? "▲ Hide" : "▼ View"}
                    </button>
                </td>
            </tr>

            {/* Expanded detail row */}
            {expanded && (
                <tr className="bg-purple-50/40">
                    <td colSpan={6} className="px-5 py-4">
                        <div className="grid md:grid-cols-3 gap-4 text-sm">

                            <DetailBlock title="📋 Description">
                                <p className="text-gray-600">{project.description || "—"}</p>
                            </DetailBlock>

                            <DetailBlock title="🔬 Objectives">
                                <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                                    {d.research_plan?.objectives?.map((o, i) => (
                                        <li key={i}>{o}</li>
                                    )) || <li>—</li>}
                                </ul>
                            </DetailBlock>

                            <DetailBlock title="📦 Deliverables">
                                <div className="flex flex-wrap gap-1">
                                    {d.research_plan?.expected_deliverables?.map((del, i) => (
                                        <Chip key={i} label={del} />
                                    )) || "—"}
                                </div>
                            </DetailBlock>

                            <DetailBlock title="⚙️ Frameworks">
                                <div className="flex flex-wrap gap-1">
                                    {d.technical_design?.tools_frameworks?.map((f, i) => (
                                        <Chip key={i} label={f} />
                                    )) || "—"}
                                </div>
                            </DetailBlock>

                            <DetailBlock title="👥 Team">
                                <p className="text-gray-600 mb-1">
                                    Size: {d.resource_plan?.team_size || "—"}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {d.resource_plan?.roles?.map((r, i) => (
                                        <Chip key={i} label={r} />
                                    ))}
                                </div>
                            </DetailBlock>

                            <DetailBlock title="📅 Milestones">
                                <ol className="list-decimal list-inside text-gray-600 space-y-0.5">
                                    {d.timeline?.major_milestones?.map((m, i) => (
                                        <li key={i}>{m}</li>
                                    )) || <li>—</li>}
                                </ol>
                            </DetailBlock>

                            <DetailBlock title="🗄️ Data Sources">
                                <div className="flex flex-wrap gap-1">
                                    {d.data_strategy?.data_sources?.map((s, i) => (
                                        <Chip key={i} label={s} />
                                    )) || "—"}
                                </div>
                            </DetailBlock>

                            <DetailBlock title="☁️ Infrastructure">
                                <p className="text-gray-600">
                                    {d.resource_plan?.compute_resources || "—"}
                                </p>
                                <p className="text-gray-500 text-xs mt-1">
                                    {d.resource_plan?.infrastructure || ""}
                                </p>
                            </DetailBlock>

                            <DetailBlock title="⚠️ Key Risks">
                                <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                                    {[
                                        ...(d.risk_management?.technical_risks || []),
                                        ...(d.risk_management?.operational_risks || []),
                                    ].slice(0, 3).map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                            </DetailBlock>

                            {/* Open button */}
                            <div className="md:col-span-3 flex justify-end pt-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/researcher/project/${project.id}`);
                                    }}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg transition"
                                >
                                    Open Project →
                                </button>
                            </div>

                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

// ─── Project Table ────────────────────────────────────────────────────────────
function ProjectTable({ projects }) {
    if (!projects?.length) {
        return <p className="text-center text-gray-400 py-10">No projects found.</p>;
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide">
                        <th className="p-3">Title</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">AI Approach</th>
                        <th className="p-3">Models</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3">Details</th>
                    </tr>
                </thead>
                <tbody>
                    {projects.map((p) => (
                        <ProjectRow key={p.id} project={p} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ResearcherHome() {

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const { user } = useAuth();

    // ✅ Uses researcher-specific hook → GET /projects/researcher/{user_id}
    const { projects, loading, error } = useResearcherProjects(user?.user_id);

    return (
        <div>

            <TopNavBar />

            <div className="min-h-screen flex bg-gray-100 pt-20">

                <SideNavBarInvestigator
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                />

                <div className={`flex flex-col flex-grow transition-all duration-300 ${isSidebarOpen ? "ml-80" : "ml-16"
                    }`}>
                    <div className="p-6">

                        <h1 className="text-2xl font-bold mb-1 text-gray-800">
                            AI R&D Projects
                        </h1>
                        <p className="text-sm text-gray-400 mb-6">
                            Projects linked to your approved research proposals
                        </p>

                        <div className="bg-white rounded-xl shadow-md p-6 min-h-[300px]">

                            {loading && (
                                <p className="text-gray-500 text-center mt-10">
                                    Loading projects...
                                </p>
                            )}

                            {error && (
                                <p className="text-red-500 text-center mt-10">{error}</p>
                            )}

                            {!loading && !error && projects.length === 0 && (
                                <div className="text-center mt-10">
                                    <p className="text-4xl mb-3">🔬</p>
                                    <p className="text-gray-500 font-medium">No projects yet</p>
                                    <p className="text-gray-400 text-sm mt-1">
                                        Projects appear here once a PM creates one from your approved proposal.
                                    </p>
                                </div>
                            )}

                            {!loading && !error && projects.length > 0 && (
                                <ProjectTable projects={projects} />
                            )}

                        </div>

                    </div>
                </div>

            </div>

        </div>
    );
}