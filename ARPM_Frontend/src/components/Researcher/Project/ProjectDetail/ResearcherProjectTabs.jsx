export default function ResearcherProjectTabs({
    activeTab, setActiveTab, budgetStatus, hasReleasedTranche
}) {
    const TABS = [
        { key: "overview", label: "Overview" },
        { key: "statistics", label: "Statistics" },

        // Budget visible once it exists
        ...(budgetStatus
            ? [{ key: "budget", label: "Budget" }]
            : []
        ),

        // Release Plan visible once budget is approved
        ...(budgetStatus === "approved"
            ? [{ key: "release_plan", label: "Release Plan" }]
            : []
        ),

        // Phases — researcher's work area, unlocks when tranche released
        ...(hasReleasedTranche
            ? [{ key: "phases", label: "Phases 🔬" }]
            : []
        ),
    ];

    return (
        <div className="flex gap-6 border-b mb-6">
            {TABS.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`pb-2 transition-all duration-200 ${
                        activeTab === tab.key
                            ? "border-b-2 border-purple-600 text-purple-600 font-medium"
                            : "text-gray-500 hover:text-purple-500"
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
