
export default function CommitteeTabs({
    activeTab,
    setActiveTab,
    budgetStatus,
    hasReleasedTranche,
}) {
    const TABS = [
        { key: "overview", label: "Overview" },
        { key: "statistics", label: "Statistics" },
        { key: "budget", label: "Budget" },

        ...(budgetStatus === "approved"
            ? [{ key: "release_plan", label: "Release Plan" }]
            : []
        ),

        ...(hasReleasedTranche
            ? [{ key: "phases", label: "Phases" }]
            : []
        ),
    ];

    return (
        <div className="flex gap-6 border-b mb-6">
            {TABS.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`pb-2 capitalize transition-all duration-200 ${activeTab === tab.key
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