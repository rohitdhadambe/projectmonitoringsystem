import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
  RadialBarChart, RadialBar
} from "recharts";

export default function CommitteeStatisticsTab({ projectId }) {

  const [data, setData] = useState(null);

  useEffect(() => {
    fetchAll();
  }, [projectId]);

  const fetchAll = async () => {
    try {
      const projectRes = await fetch(`http://127.0.0.1:8000/projects/${projectId}`);
      const project = await projectRes.json();

      const proposalRes = await fetch(
        `http://127.0.0.1:8000/proposals/${project.proposal_id}`
      );

      const [budgetRes, releaseRes, phaseRes] = await Promise.all([
        fetch(`http://127.0.0.1:8000/budget/project/${projectId}`),
        fetch(`http://127.0.0.1:8000/release-plan/project/${projectId}`),
        fetch(`http://127.0.0.1:8000/phases/project/${projectId}`)
      ]);

      const proposal = await proposalRes.json();
      const budget = await budgetRes.json();
      const release = await releaseRes.json();
      const phases = await phaseRes.json();

      setData({ project, proposal, budget, release, phases });

    } catch (err) {
      console.error(err);
    }
  };

  if (!data) return <div className="text-gray-400">Loading...</div>;

  // ================= SAFE DATA =================
  const budget = data.budget || {};

  const phasesArray = Array.isArray(data.phases)
    ? data.phases
    : data.phases?.phases || [];

  const trancheArray = Array.isArray(data.release?.tranches)
    ? data.release.tranches
    : [];

  // ================= KPI =================
  const kpis = [
    { title: "Project Status", value: data.project?.status || "N/A" },
    { title: "Proposal Status", value: data.proposal?.status || "N/A" },
    { title: "Budget Status", value: budget.status || "N/A" },
    { title: "Total Budget", value: `₹ ${budget.total_budget || 0}` },
  ];

  // ================= PIE (Budget) =================
  const pieData = [
    { name: "Compute", value: budget.compute_cost || 0 },
    { name: "Data", value: budget.data_acquisition_cost || 0 },
    { name: "Manpower", value: budget.manpower_cost || 0 },
    { name: "Infra", value: budget.infrastructure_cost || 0 },
    { name: "Misc", value: budget.miscellaneous_cost || 0 },
  ];

  const COLORS = ["#7c3aed", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444"];

  // ================= BAR =================
  const trancheData = trancheArray.map((t) => ({
    name: t.tranche_name,
    amount: Number(t.amount),
    released: Number(t.released_amount),
  }));

  // ================= LINE =================
  const phaseData = phasesArray.map((p) => ({
    name: `P${p.phase_number}`,
    progress:
      p.status === "completed"
        ? 100
        : p.status === "active"
        ? 60
        : p.status === "submitted"
        ? 80
        : 10,
  }));

  // ================= PHASE PIE =================
  const phaseStatusCount = {};
  phasesArray.forEach(p => {
    phaseStatusCount[p.status] = (phaseStatusCount[p.status] || 0) + 1;
  });

  const phasePie = Object.keys(phaseStatusCount).map(key => ({
    name: key,
    value: phaseStatusCount[key]
  }));

  // ================= RADIAL (Proposal Progress) =================
  const proposalStatusMap = {
    draft: 20,
    submitted_to_pm: 40,
    submitted_to_reviewers: 60,
    review_completed: 75,
    submitted_to_committee: 85,
    approved: 100,
    rejected: 100
  };

  const proposalProgress = proposalStatusMap[data.proposal.status] || 10;

  const proposalRadialData = [
    {
      name: data.proposal.status,
      value: proposalProgress
    }
  ];

  return (
    <div className="space-y-6">

      {/* ================= KPI ================= */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl shadow hover:shadow-xl transition">
            <p className="text-gray-500 text-sm">{k.title}</p>
            <h2 className="text-2xl font-bold text-purple-600">{k.value}</h2>

            <ResponsiveContainer width="100%" height={40}>
              <LineChart data={phaseData}>
                <Line type="monotone" dataKey="progress" stroke="#7c3aed" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* ================= TOP CHARTS ================= */}
      <div className="grid grid-cols-2 gap-6">

        {/* Budget Pie */}
        <div className="bg-white p-5 rounded-2xl shadow">
          <h3 className="font-semibold mb-4">Budget Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" outerRadius={90}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 🔥 NEW RADIAL */}
        <div className="bg-white p-5 rounded-2xl shadow flex flex-col items-center justify-center">
          <h3 className="font-semibold mb-4">Proposal Progress</h3>

          <ResponsiveContainer width="100%" height={260}>
            <RadialBarChart
              innerRadius="70%"
              outerRadius="100%"
              data={proposalRadialData}
              startAngle={180}
              endAngle={0}
            >
              <RadialBar dataKey="value" fill="#7c3aed" cornerRadius={10} />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>

          <div className="text-center mt-[-140px]">
            <p className="text-3xl font-bold text-purple-600">
              {proposalProgress}%
            </p>
            <p className="text-gray-500 text-sm capitalize">
              {data.proposal.status.replaceAll("_", " ")}
            </p>
          </div>
        </div>

      </div>

      {/* ================= MIDDLE ================= */}
      <div className="grid grid-cols-2 gap-6">

        {/* Bar */}
        <div className="bg-white p-5 rounded-2xl shadow">
          <h3 className="font-semibold mb-4">Tranche vs Released</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trancheData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="amount" fill="#7c3aed" />
              <Bar dataKey="released" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Phase Pie */}
        <div className="bg-white p-5 rounded-2xl shadow">
          <h3 className="font-semibold mb-4">Phase Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={phasePie} dataKey="value" outerRadius={90}>
                {phasePie.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* ================= LINE ================= */}
      <div className="bg-white p-5 rounded-2xl shadow">
        <h3 className="font-semibold mb-4">Phase Progress Trend</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={phaseData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="progress" stroke="#7c3aed" />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}