import { useState } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function BudgetStatusBadge({ status }) {
    const map = {
        draft: "bg-gray-100 text-gray-500",
        submitted: "bg-blue-100 text-blue-700",
        approved: "bg-green-100 text-green-700",
        revision_requested: "bg-red-100 text-red-600",
    };
    if (!status) return (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-50 text-gray-400">
            No Budget
        </span>
    );
    return (
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${map[status] || "bg-gray-100 text-gray-500"}`}>
            {status.replace("_", " ")}
        </span>
    );
}

function Chip({ label }) {
    return (
        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
            {label}
        </span>
    );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function ProjectRow({ project, onRowClick }) {

    const [expanded, setExpanded] = useState(false);
    const d = project.project_details || {};

    return (
        <>
            {/* Main Row */}
            <tr
                onClick={() => onRowClick(project.id)}
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
                        ? `${d.timeline.estimated_duration_months} mo`
                        : "—"}
                </td>

                {/* Budget status column — key info for committee */}
                <td className="p-3">
                    <BudgetStatusBadge status={project.budget_status} />
                </td>

                {/* Expand — stopPropagation so it doesn't navigate */}
                <td className="p-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                        className="text-sm text-purple-600 hover:underline font-medium"
                    >
                        {expanded ? "▲ Hide" : "▼ View"}
                    </button>
                </td>
            </tr>

            {/* Expanded preview row */}
            {expanded && (
                <tr className="bg-purple-50/40">
                    <td colSpan={7} className="px-5 py-4">
                        <div className="grid md:grid-cols-3 gap-4 text-sm">

                            <Block title="📋 Description">
                                <p className="text-gray-600">{project.description || "—"}</p>
                            </Block>

                            <Block title="🔬 Objectives">
                                <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                                    {d.research_plan?.objectives?.map((o, i) => (
                                        <li key={i}>{o}</li>
                                    )) || <li>—</li>}
                                </ul>
                            </Block>

                            <Block title="⚙️ Frameworks">
                                <div className="flex flex-wrap gap-1">
                                    {d.technical_design?.tools_frameworks?.map((f, i) => (
                                        <Chip key={i} label={f} />
                                    )) || "—"}
                                </div>
                            </Block>

                            <Block title="📦 Deliverables">
                                <div className="flex flex-wrap gap-1">
                                    {d.research_plan?.expected_deliverables?.map((del, i) => (
                                        <Chip key={i} label={del} />
                                    )) || "—"}
                                </div>
                            </Block>

                            <Block title="👥 Team">
                                <p className="text-gray-600">
                                    Size: {d.resource_plan?.team_size || "—"}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {d.resource_plan?.roles?.map((r, i) => (
                                        <Chip key={i} label={r} />
                                    ))}
                                </div>
                            </Block>

                            <Block title="📅 Milestones">
                                <ol className="list-decimal list-inside text-gray-600 space-y-0.5">
                                    {d.timeline?.major_milestones?.map((m, i) => (
                                        <li key={i}>{m}</li>
                                    )) || <li>—</li>}
                                </ol>
                            </Block>

                            {/* Open button */}
                            <div className="md:col-span-3 flex justify-end pt-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRowClick(project.id); }}
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

function Block({ title, children }) {
    return (
        <div>
            <p className="font-semibold text-gray-700 mb-1">{title}</p>
            {children}
        </div>
    );
}

// ─── Table ────────────────────────────────────────────────────────────────────

export default function CommitteeProjectTable({ projects, onRowClick }) {
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
                        <th className="p-3">Budget Status</th>
                        <th className="p-3">Details</th>
                    </tr>
                </thead>
                <tbody>
                    {projects.map((p) => (
                        <ProjectRow
                            key={p.id}
                            project={p}
                            onRowClick={onRowClick}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
