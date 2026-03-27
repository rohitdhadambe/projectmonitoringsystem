import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SideNavBarInvestigator from "../SideNavBar/SideNavBar";
import useProjects from "../../../hooks/useProjects";
import TopNavBar from "../../../layout/TopNavBar";
import { useAuth } from "../../../components/context/AuthContext";
import ProjectTable from "../Project/Main/ProjectTable";

export default function PMHome() {

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const navigate = useNavigate();
    const { user } = useAuth();
    const { projects, loading, error } = useProjects(user?.user_id);

    return (
        <div>

            <TopNavBar />

            <div className="min-h-screen flex bg-gray-100 pt-20">

                <SideNavBarInvestigator
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                />

                <div
                    className={`flex flex-col flex-grow transition-all duration-300 ${isSidebarOpen ? "ml-80" : "ml-16"
                        }`}
                >

                    <div className="p-6">

                        <h1 className="text-2xl font-bold mb-6 text-gray-800">
                            AI R&D Projects
                        </h1>

                        <div className="bg-white rounded-xl shadow-md p-6 min-h-[300px]">

                            {loading && (
                                <p className="text-gray-500">Loading projects...</p>
                            )}

                            {error && (
                                <p className="text-red-500">{error}</p>
                            )}

                            {!loading && !error && projects.length === 0 && (
                                <p className="text-center text-gray-400 mt-10">
                                    No projects yet 🚀
                                </p>
                            )}

                            {!loading && !error && projects.length > 0 && (
                                <ProjectTable projects={projects} />
                            )}

                        </div>

                    </div>

                </div>

            </div>

            {/* Floating + Button */}
            <button
                onClick={() => navigate("/manager/projects/create")}
                title="Create New Project"
                className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white w-14 h-14 rounded-full text-2xl shadow-lg transition-all duration-200 flex items-center justify-center z-50"
            >
                +
            </button>

        </div>
    );
}