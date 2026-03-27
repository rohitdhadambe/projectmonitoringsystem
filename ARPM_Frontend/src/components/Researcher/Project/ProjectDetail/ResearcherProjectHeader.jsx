import { useNavigate } from "react-router-dom";

function StatusBadge({ status }) {
    const styles = {
        active:    "bg-green-100 text-green-700 border border-green-200",
        on_hold:   "bg-yellow-100 text-yellow-700 border border-yellow-200",
        completed: "bg-blue-100 text-blue-700 border border-blue-200",
    };
    return (
        <span className={`px-3 py-1 text-sm rounded-full font-medium capitalize ${styles[status] || "bg-gray-100 text-gray-600"}`}>
            {status?.replace("_", " ")}
        </span>
    );
}

export default function ResearcherProjectHeader({ project }) {
    const navigate = useNavigate();
    const td = project.project_details?.technical_design || {};

    return (
        <div className="mb-6">
            {/* Back + page title */}
            <div className="flex items-start justify-between">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="text-sm text-gray-400 hover:text-purple-600 transition mb-1 flex items-center gap-1"
                    >
                        ← Back to Projects
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">Project Details</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Track your research project and work on assigned phases
                    </p>
                </div>
                <StatusBadge status={project.status} />
            </div>

            {/* Project title card */}
            <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start justify-between">
                <div>
                    <h2 className="text-xl font-bold text-purple-700">{project.title}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {td.ai_approach || "AI R&D Project"}
                        {td.models?.length ? ` · ${td.models.slice(0, 3).join(", ")}` : ""}
                    </p>
                    {project.description && (
                        <p className="text-sm text-gray-600 mt-3 border-t pt-3">
                            {project.description}
                        </p>
                    )}
                </div>
                <StatusBadge status={project.status} />
            </div>
        </div>
    );
}
