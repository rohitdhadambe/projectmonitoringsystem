// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, icon, children }) {
    return (
        <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2 border-b pb-2">
                <span>{icon}</span> {title}
            </h3>
            {children}
        </div>
    );
}

function InfoGrid({ children }) {
    return (
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {children}
        </div>
    );
}

function InfoItem({ label, value }) {
    return (
        <div>
            <p className="text-xs text-gray-400 mb-0.5">{label}</p>
            <p className="text-sm text-gray-700 font-medium">{value || "—"}</p>
        </div>
    );
}

function Chip({ label, color = "purple" }) {
    const colors = {
        purple: "bg-purple-100 text-purple-700",
        blue:   "bg-blue-100   text-blue-700",
        green:  "bg-green-100  text-green-700",
        yellow: "bg-yellow-100 text-yellow-700",
        red:    "bg-red-100    text-red-600",
    };
    return (
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${colors[color]}`}>
            {label}
        </span>
    );
}

function BulletList({ items, color = "purple" }) {
    const dotColors = {
        purple: "text-purple-400",
        red:    "text-red-400",
        yellow: "text-yellow-400",
        green:  "text-green-500",
    };
    if (!items?.length) return <p className="text-sm text-gray-400">—</p>;
    return (
        <ul className="space-y-1.5">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className={`mt-1 text-xs ${dotColors[color]}`}>◆</span>
                    {item}
                </li>
            ))}
        </ul>
    );
}

function Divider() {
    return <hr className="my-6 border-gray-100" />;
}

// ─── Main Card ────────────────────────────────────────────────────────────────

export default function ProjectOverviewCard({ project }) {
    const d   = project.project_details    || {};
    const rp  = d.research_plan            || {};
    const td  = d.technical_design         || {};
    const ds  = d.data_strategy            || {};
    const res = d.resource_plan            || {};
    const tl  = d.timeline                 || {};
    const rm  = d.risk_management          || {};

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">

            {/* ── 1. Basic Info ── */}
            <Section title="Basic Information" icon="📋">
                <InfoGrid>
                    <InfoItem label="Project ID"          value={`#${project.id}`} />
                    <InfoItem label="Proposal ID"         value={`#${project.proposal_id}`} />
                    <InfoItem label="Status"              value={project.status?.replace("_", " ")} />
                    <InfoItem label="AI Approach"         value={td.ai_approach} />
                    <InfoItem label="Deployment Strategy" value={td.deployment_strategy} />
                    <InfoItem
                        label="Estimated Duration"
                        value={tl.estimated_duration_months ? `${tl.estimated_duration_months} months` : "—"}
                    />
                    <InfoItem label="Team Size"           value={res.team_size} />
                    <InfoItem label="Compute Resources"   value={res.compute_resources} />
                </InfoGrid>
            </Section>

            <Divider />

            {/* ── 2. Research Plan ── */}
            <Section title="Research Plan" icon="🔬">
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-xs text-gray-400 mb-2">Objectives</p>
                        <BulletList items={rp.objectives} color="purple" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-2">Expected Deliverables</p>
                        <div className="flex flex-wrap gap-2">
                            {rp.expected_deliverables?.map((d, i) => (
                                <Chip key={i} label={d} color="purple" />
                            )) || <p className="text-sm text-gray-400">—</p>}
                        </div>
                    </div>
                </div>
            </Section>

            <Divider />

            {/* ── 3. Technical Design ── */}
            <Section title="Technical Design" icon="⚙️">
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-xs text-gray-400 mb-2">Models</p>
                        <div className="flex flex-wrap gap-2">
                            {td.models?.map((m, i) => (
                                <Chip key={i} label={m} color="purple" />
                            )) || <p className="text-sm text-gray-400">—</p>}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-2">Tools & Frameworks</p>
                        <div className="flex flex-wrap gap-2">
                            {td.tools_frameworks?.map((f, i) => (
                                <Chip key={i} label={f} color="blue" />
                            )) || <p className="text-sm text-gray-400">—</p>}
                        </div>
                    </div>
                </div>
            </Section>

            <Divider />

            {/* ── 4. Data Strategy ── */}
            <Section title="Data Strategy" icon="🗄️">
                <div className="grid md:grid-cols-2 gap-6 mb-4">
                    <InfoItem label="Collection Method" value={ds.data_collection_method} />
                    <InfoItem label="Preprocessing"     value={ds.data_preprocessing} />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-xs text-gray-400 mb-2">Data Sources</p>
                        <div className="flex flex-wrap gap-2">
                            {ds.data_sources?.map((s, i) => (
                                <Chip key={i} label={s} color="green" />
                            )) || <p className="text-sm text-gray-400">—</p>}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-2">Data Risks</p>
                        <BulletList items={ds.data_risks} color="yellow" />
                    </div>
                </div>
            </Section>

            <Divider />

            {/* ── 5. Resource Plan ── */}
            <Section title="Resource Planning" icon="👥">
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-xs text-gray-400 mb-2">Roles</p>
                        <div className="flex flex-wrap gap-2">
                            {res.roles?.map((r, i) => (
                                <Chip key={i} label={r} color="blue" />
                            )) || <p className="text-sm text-gray-400">—</p>}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-2">Infrastructure</p>
                        <p className="text-sm text-gray-700">{res.infrastructure || "—"}</p>
                    </div>
                </div>
            </Section>

            <Divider />

            {/* ── 6. Timeline ── */}
            <Section title="Timeline & Milestones" icon="📅">
                {tl.major_milestones?.length ? (
                    <ol className="flex flex-wrap gap-3">
                        {tl.major_milestones.map((m, i) => (
                            <li key={i} className="flex items-center gap-2">
                                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-purple-600 text-white text-xs font-bold shrink-0">
                                    {i + 1}
                                </span>
                                <span className="text-sm text-gray-700">{m}</span>
                                {i < tl.major_milestones.length - 1 && (
                                    <span className="text-gray-300 text-lg">→</span>
                                )}
                            </li>
                        ))}
                    </ol>
                ) : <p className="text-sm text-gray-400">No milestones defined.</p>}
            </Section>

            <Divider />

            {/* ── 7. Risk Management ── */}
            <Section title="Risk Management" icon="⚠️">
                <div className="grid md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-xs text-gray-400 mb-2">Technical Risks</p>
                        <BulletList items={rm.technical_risks} color="red" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-2">Operational Risks</p>
                        <BulletList items={rm.operational_risks} color="yellow" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-2">Mitigation Strategies</p>
                        <BulletList items={rm.mitigation_strategies} color="green" />
                    </div>
                </div>
            </Section>

        </div>
    );
}
