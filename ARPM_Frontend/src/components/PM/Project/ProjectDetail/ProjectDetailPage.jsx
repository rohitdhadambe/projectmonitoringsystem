import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import TopNavBar from "../../../../layout/TopNavBar";
import SideNavBarInvestigator from "../../SideNavBar/SideNavBar";

import ProjectHeader from "./ProjectHeader";
import ProjectTabs from "./ProjectTabs";
import ProjectOverviewCard from "./ProjectOverviewCard";
import ProjectBudgetTab from "../ProjectBudget/ProjectBudgetTab";
import ReleasePlanTab from "../ProjectBudget/ReleasePlanTab";
import PhaseTab from "../ProjectPhase/PhaseTab";
import CommitteeStatisticsTab from "../../../../components/CommitteeStatisticsTab";

export default function ProjectDetailPage() {

    const { id } = useParams();

    const [project, setProject] = useState(null);
    const [budget, setBudget] = useState(null);
    const [releasePlan, setReleasePlan] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => { fetchAll(); }, [id]);

    // ✅ Fetch everything in parallel
    const fetchAll = async () => {
        fetchProject();
        fetchBudget();
        fetchReleasePlan();
    };

    const fetchProject = async () => {
        const res = await fetch(`http://127.0.0.1:8000/projects/${id}`);
        if (res.ok) setProject(await res.json());
    };

    const fetchBudget = async () => {
        const res = await fetch(`http://127.0.0.1:8000/budget/project/${id}`);
        if (res.ok) setBudget(await res.json());
    };

    const fetchReleasePlan = async () => {
        const res = await fetch(`http://127.0.0.1:8000/release-plan/project/${id}`);
        if (res.ok) setReleasePlan(await res.json());
    };

    if (!project) return (
        <div className="flex items-center justify-center h-screen text-gray-400">
            Loading...
        </div>
    );

    // ✅ Phases tab unlocks when at least one tranche is released
    const hasReleasedTranche = (releasePlan?.tranches || [])
        .some(t => t.status === "released");

    return (
        <div>
            <TopNavBar />

            <div className="min-h-screen flex bg-gray-100 pt-20">

                <SideNavBarInvestigator
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                />

                <div className={`flex-grow transition-all duration-300 ${isSidebarOpen ? "ml-80" : "ml-16"
                    }`}>
                    <div className="p-6">

                        <ProjectHeader project={project} />

                        <ProjectTabs
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            budgetStatus={budget?.status}
                            hasReleasedTranche={hasReleasedTranche}
                        />

                        {activeTab === "overview" && (
                            <ProjectOverviewCard project={project} />
                        )}

                         {activeTab === "statistics" && (
                            <CommitteeStatisticsTab projectId={id} />
                        )}

                        {activeTab === "budget" && (
                            <ProjectBudgetTab
                                project={project}
                                onBudgetChange={fetchBudget}
                            />
                        )}

                        {activeTab === "release_plan" && (
                            <ReleasePlanTab
                                project={project}
                                userRole="pm"
                            />
                        )}

                        {activeTab === "phases" && (
                            <PhaseTab
                                project={project}
                                userRole="pm"
                            />
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
}