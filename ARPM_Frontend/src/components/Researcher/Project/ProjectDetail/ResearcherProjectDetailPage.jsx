import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import TopNavBar from "../../../../layout/TopNavBar";
import SideNavBarInvestigator from "../../SideNavBar/SideNavBar";

import ResearcherProjectHeader from "./ResearcherProjectHeader";
import ResearcherProjectTabs   from "./ResearcherProjectTabs";
import ResearcherOverviewCard  from "./ResearcherOverviewCard";
import ResearcherBudgetView    from "../ProjectBudget/ResearcherBudgetView";
import ResearcherReleasePlanView from "../ProjectBudget/ResearcherReleasePlanView";
import ResearcherPhaseTab      from "../ProjectPhase/ResearcherPhaseTab";
import CommitteeStatisticsTab from "../../../../components/CommitteeStatisticsTab";

export default function ResearcherProjectDetailPage() {

    const { id } = useParams();

    const [project,         setProject]         = useState(null);
    const [budget,          setBudget]           = useState(null);
    const [releasePlan,     setReleasePlan]      = useState(null);
    const [activeTab,       setActiveTab]        = useState("overview");
    const [isSidebarOpen,   setIsSidebarOpen]    = useState(true);

    useEffect(() => { fetchAll(); }, [id]);

    const fetchAll = () => {
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
        if (res.ok) {
            const data = await res.json();
            data.tranches = data.tranches || [];
            setReleasePlan(data);
        }
    };

    if (!project) return (
        <div className="flex items-center justify-center h-screen text-gray-400">
            Loading...
        </div>
    );

    // ✅ Phases tab unlocks only when ≥1 tranche released
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

                <div className={`flex-grow transition-all duration-300 ${
                    isSidebarOpen ? "ml-80" : "ml-16"
                }`}>
                    <div className="p-6">

                        <ResearcherProjectHeader project={project} />

                        <ResearcherProjectTabs
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            budgetStatus={budget?.status}
                            hasReleasedTranche={hasReleasedTranche}
                        />

                        {/* Overview — full read-only project details */}
                        {activeTab === "overview" && (
                            <ResearcherOverviewCard project={project} />
                        )}

                         {activeTab === "statistics" && (
                            <CommitteeStatisticsTab projectId={id} />
                        )}

                        {/* Budget — read-only, shows status + costs + docs */}
                        {activeTab === "budget" && (
                            <ResearcherBudgetView projectId={id} />
                        )}

                        {/* Release Plan — read-only tranche tracker */}
                        {activeTab === "release_plan" && (
                            <ResearcherReleasePlanView projectId={id} />
                        )}

                        {/* Phases — researcher's main work area */}
                        {activeTab === "phases" && (
                            <ResearcherPhaseTab
                                project={project}
                                onRefresh={fetchAll}
                            />
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
}
