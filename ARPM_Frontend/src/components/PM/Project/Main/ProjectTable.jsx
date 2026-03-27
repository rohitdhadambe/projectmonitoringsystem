import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
    const styles = {
        active: "bg-green-100 text-green-700",
        on_hold: "bg-yellow-100 text-yellow-700",
        completed: "bg-blue-100 text-blue-700",
    };

    return (
        <span
            className={`px-2 py-1 text-xs rounded-full font-medium ${styles[status] || "bg-gray-100 text-gray-600"
                }`}
        >
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

// ─── Project Row ─────────────────────────────────────────────────────────────

function ProjectRow({ project }) {
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(false);
    const d = project.project_details || {};

    return (
        <>
            {/* ✅ Main Row — click anywhere on row to navigate */}
            <tr
                onClick={() => navigate(`/manager/project/${project.id}`)}
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

                {/* ✅ Expand button — stopPropagation so it doesn't also navigate */}
                <td className="p-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setExpanded(!expanded);
                        }}
                        className="text-sm text-purple-600 hover:underline font-medium"
                    >
                        {expanded ? "▲ Hide" : "▼ View"}
                    </button>
                </td>
            </tr>

            {/* Expanded Detail Row */}
            {expanded && (
                <tr className="bg-purple-50/40">
                    <td colSpan={6} className="px-5 py-4">
                        <div className="grid md:grid-cols-3 gap-4 text-sm">

                            <DetailBlock title="📋 Description">
                                <p className="text-gray-600">
                                    {project.description || "—"}
                                </p>
                            </DetailBlock>

                            <DetailBlock title="🔬 Objectives">
                                <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                                    {d.research_plan?.objectives?.map((o, i) => (
                                        <li key={i}>{o}</li>
                                    )) || <li>—</li>}
                                </ul>
                            </DetailBlock>

                            <DetailBlock title="📦 Deliverables">
                                <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                                    {d.research_plan?.expected_deliverables?.map(
                                        (del, i) => <li key={i}>{del}</li>
                                    ) || <li>—</li>}
                                </ul>
                            </DetailBlock>

                            <DetailBlock title="⚙️ Frameworks">
                                <div className="flex flex-wrap gap-1">
                                    {d.technical_design?.tools_frameworks?.map(
                                        (f, i) => <Chip key={i} label={f} />
                                    ) || "—"}
                                </div>
                            </DetailBlock>

                            <DetailBlock title="🗄️ Data Sources">
                                <div className="flex flex-wrap gap-1">
                                    {d.data_strategy?.data_sources?.map((s, i) => (
                                        <Chip key={i} label={s} />
                                    )) || "—"}
                                </div>
                            </DetailBlock>

                            <DetailBlock title="👥 Team">
                                <p className="text-gray-600">
                                    Size: {d.resource_plan?.team_size || "—"}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1">
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
                                    ]
                                        .slice(0, 3)
                                        .map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                            </DetailBlock>

                            {/* ✅ Dedicated navigate button in expanded view */}
                            <div className="md:col-span-3 flex justify-end pt-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/manager/project/${project.id}`);
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

function DetailBlock({ title, children }) {
    return (
        <div>
            <p className="font-semibold text-gray-700 mb-1">{title}</p>
            {children}
        </div>
    );
}

// ─── Table ────────────────────────────────────────────────────────────────────

export default function ProjectTable({ projects }) {
    if (!projects?.length) {
        return (
            <p className="text-center text-gray-400 py-10">No projects found.</p>
        );
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