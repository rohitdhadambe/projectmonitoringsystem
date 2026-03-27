import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import TopNavBar from "../../../../layout/TopNavBar";
import SideNavBarInvestigator from "../../SideNavBar/SideNavBar";

import ProjectHeader from "../../../PM/Project/ProjectDetail/ProjectHeader";
import CommitteeTabs from "./CommitteeTabs";
import ProjectOverviewCard from "../../../PM/Project/ProjectDetail/ProjectOverviewCard";
import CommitteeBudgetTab from "../Main/CommitteeBudgetTab";
import ReleasePlanTab from "../../../PM/Project/ProjectBudget/ReleasePlanTab";
import CommitteePhaseTab from "./Committeephasetab";
import CommitteeStatisticsTab from "../../../../components/CommitteeStatisticsTab";

export default function CommitteeProjectDetailPage() {

    const { id } = useParams();

    const [project, setProject] = useState(null);
    const [budget, setBudget] = useState(null);
    const [releasePlan, setReleasePlan] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

                        <ProjectHeader project={project} backPath="/committee/projects" />

                        <CommitteeTabs
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
                            <CommitteeBudgetTab
                                project={project}
                                onBudgetChange={fetchBudget}
                            />
                        )}

                        {activeTab === "release_plan" && (
                            <ReleasePlanTab
                                project={project}
                                userRole="committee"
                            />
                        )}

                        {activeTab === "phases" && (
                            <CommitteePhaseTab project={project} />
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
}