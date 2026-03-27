import { useState } from "react";

function ProjectRow({ project }) {

    const [expanded, setExpanded] = useState(false);

    const details = project.project_details || {};

    return (
        <>
            {/* MAIN ROW */}
            <tr className="border-b hover:bg-gray-50">

                <td className="p-3 font-medium text-purple-700">
                    {project.title}
                </td>

                <td className="p-3">
                    <StatusBadge status={project.status} />
                </td>

                <td className="p-3 text-sm">
                    {details.technical_design?.ai_approach || "-"}
                </td>

                <td className="p-3 text-sm">
                    {details.technical_design?.models?.slice(0, 2).join(", ") || "-"}
                </td>

                <td className="p-3 text-sm">
                    {details.timeline?.estimated_duration_months
                        ? `${details.timeline.estimated_duration_months} mo`
                        : "-"}
                </td>

                <td className="p-3">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-purple-600 text-sm hover:underline"
                    >
                        {expanded ? "Hide" : "View"}
                    </button>
                </td>

            </tr>

            {/* EXPANDED ROW */}
            {expanded && (
                <tr className="bg-gray-50">

                    <td colSpan="6" className="p-4">

                        <div className="grid md:grid-cols-2 gap-4 text-sm">

                            {/* DESCRIPTION */}
                            <div>
                                <p className="font-semibold">Description</p>
                                <p className="text-gray-600">
                                    {project.description || "-"}
                                </p>
                            </div>

                            {/* MODELS */}
                            <div>
                                <p className="font-semibold">Models</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {details.technical_design?.models?.map((m, i) => (
                                        <span key={i} className="chip">{m}</span>
                                    ))}
                                </div>
                            </div>

                            {/* TIMELINE */}
                            <div>
                                <p className="font-semibold">Timeline</p>
                                <p className="text-gray-600">
                                    {details.timeline?.major_milestones?.join(", ") || "-"}
                                </p>
                            </div>

                            {/* RESOURCES */}
                            <div>
                                <p className="font-semibold">Resources</p>
                                <p className="text-gray-600">
                                    {details.resource_plan?.compute_resources || "-"}
                                </p>
                            </div>

                        </div>

                    </td>

                </tr>
            )}
        </>
    );
}