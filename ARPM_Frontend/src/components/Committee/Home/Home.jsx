import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopNavBar from "../../../layout/TopNavBar";
import SideNavBarInvestigator from "../SideNavBar/SideNavBar";
import CommitteeProjectTable from "../Project/ProjectDetail/CommitteeProjectTable"
import { useEffect } from "react";

export default function CommitteeHome() {

    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // ✅ Fetch ALL projects directly — no hook dependency on pm_id
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllProjects = async () => {
            try {
                setLoading(true);
                const res = await fetch("http://127.0.0.1:8000/projects/all");
                if (!res.ok) throw new Error("Failed to fetch projects");
                const data = await res.json();
                setProjects(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAllProjects();
    }, []);

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
                            Review project budgets and provide committee decisions
                        </p>

                        <div className="bg-white rounded-xl shadow-md p-6 min-h-[300px]">

                            {loading && (
                                <p className="text-gray-400 text-center mt-10">
                                    Loading projects...
                                </p>
                            )}

                            {error && (
                                <p className="text-red-500 text-center mt-10">
                                    {error}
                                </p>
                            )}

                            {!loading && !error && projects.length === 0 && (
                                <p className="text-center text-gray-400 mt-10">
                                    No projects found.
                                </p>
                            )}

                            {!loading && !error && projects.length > 0 && (
                                <CommitteeProjectTable
                                    projects={projects}
                                    onRowClick={(id) =>
                                        navigate(`/committee/project/${id}`)
                                    }
                                />
                            )}

                        </div>
                    </div>
                </div>

            </div>
            {/* ❌ No floating + button — committee cannot create projects */}
        </div>
    );
}