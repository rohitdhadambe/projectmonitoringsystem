import { useState, useEffect, useRef } from "react";
import SideNavBarInvestigator from "../SideNavBar/SideNavBar";
import TopNavBar from "../../../layout/TopNavBar";

// ─── Animated Counter ───────────────────────────────────────────────
function AnimatedNumber({ value, duration = 1200, prefix = "", suffix = "" }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const animate = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(ease * value));
      if (t < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);

  return (
    <span>
      {prefix}{display.toLocaleString("en-IN")}{suffix}
    </span>
  );
}

// ─── Radial Progress Ring ────────────────────────────────────────────
function RingProgress({ pct, size = 80, stroke = 7, color = "#6d28d9" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1.4s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}

// ─── Mini Sparkline ──────────────────────────────────────────────────
function Sparkline({ data, color }) {
  const w = 80, h = 32;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={color} fillOpacity="0.12" stroke="none" />
    </svg>
  );
}

// ─── Activity Dot ────────────────────────────────────────────────────
function Dot({ active }) {
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      background: active ? "#6d28d9" : "#d1d5db",
      boxShadow: active ? "0 0 0 3px #ede9fe" : "none",
      flexShrink: 0,
    }} />
  );
}

// ─── Badge ───────────────────────────────────────────────────────────
function Badge({ label, color }) {
  const palettes = {
    green: { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
    red: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
    yellow: { bg: "#fefce8", text: "#ca8a04", border: "#fde68a" },
    purple: { bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe" },
    blue: { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
  };
  const p = palettes[color] || palettes.purple;
  return (
    <span style={{
      background: p.bg, color: p.text, border: `1px solid ${p.border}`,
      borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 600, letterSpacing: ".03em",
    }}>
      {label}
    </span>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────
export default function PMDashboard() {
  return (
    <div>
      <TopNavBar />
      <div className="min-h-screen flex bg-gray-100 pt-20">
        <SideNavBarInvestigator isSidebarOpen={true} setIsSidebarOpen={() => {}} />
        <div className="flex flex-col flex-grow transition-all duration-300 ml-80">
          <PMDashboardContent />
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Content (API-connected) ───────────────────────────────
function PMDashboardContent() {

  // ── State ──────────────────────────────────────────────────────────
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Fetch dashboard data ───────────────────────────────────────────
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

fetch(`http://localhost:8000/dashboard/${user.user_id}?role=${user.role}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // ── Loading state ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ textAlign: "center", color: "#6b7280" }}>
          <div style={{
            width: 40, height: 40, border: "4px solid #e5e7eb",
            borderTop: "4px solid #6d28d9", borderRadius: "50%",
            animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: 14 }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <p style={{ color: "#dc2626", fontSize: 14 }}>Error: {error}</p>
      </div>
    );
  }

  // ── Map API response to what the UI expects ────────────────────────
  const stats = {
    proposals: {
      total:    data.proposals.total,
      accepted: data.proposals.accepted,
      rejected: data.proposals.rejected,
      pending:  data.proposals.pending,
    },
    projects: {
      total:     data.projects.total,
      active:    data.projects.active,
      completed: data.projects.completed,
      onHold:    data.projects.on_hold,   // API sends on_hold → map to onHold
    },
    messages: {
      total:  data.recent_messages.length,
      unread: data.recent_messages.filter((m) => m.unread).length,
      sent:   0,   // not in API yet — add a sent count to API if needed
    },
    budget: {
      sanctioned: data.budget.sanctioned,
      released:   data.budget.released,
    },
  };

  const recentMessages = data.recent_messages.map((m) => ({
    from:    m.sender_email,
    name:    m.sender_name,
    subject: m.subject,
    time:    m.time,
    unread:  m.unread,
    tag:     "Message",   // API doesn't send tags yet — add tag field to API if needed
  }));

  const recentProjects = data.recent_projects.map((p) => ({
    name:     p.name,
    phase:    p.phase,
    lead:     p.lead,
    status:   p.status,
    progress: p.progress,
  }));

  // ── Derived values ─────────────────────────────────────────────────
  const budgetPct = stats.budget.sanctioned > 0
    ? Math.round((stats.budget.released / stats.budget.sanctioned) * 100)
    : 0;
  const fmtCr = (n) => `₹${(n / 10000000).toFixed(2)} Cr`;

  const tagColors = { Message: "blue", Review: "blue", Update: "green", Finance: "yellow", Admin: "purple", Revision: "red" };
  const statusColors = { active: "green", completed: "blue", "on-hold": "yellow", on_hold: "yellow" };
  const proposalTrend = [5, 8, 6, 11, 9, 14, 12, stats.proposals.total]; // sparkline — static shape, real end value

  const S = {
    main: { flex: 1, padding: "24px", maxWidth: "100%" },
    pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
    pageTitle: { fontSize: 22, fontWeight: 500, color: "#111", letterSpacing: "-.03em", margin: 0 },
    pageDate: { fontSize: 13, color: "#9ca3af", marginTop: 2 },
    grid4: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 },
    grid3: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 },
    card: (extra = {}) => ({
      background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb",
      padding: "20px 22px", boxShadow: "0 1px 3px rgba(0,0,0,.05)",
      transition: "box-shadow .2s, transform .2s", ...extra,
    }),
  };

  return (
    <main style={S.main}>

      {/* Header */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.pageTitle}>Dashboard Overview</h1>
          <p style={S.pageDate}>
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </div>
        <span className="bg-purple-600 text-white rounded-full px-4 py-1.5 text-xs font-bold tracking-wide shadow-md">
        </span>
      </div>

      {/* ── ROW 1: KPI Cards ──────────────────────── */}
      <div style={S.grid4}>
        {[
          { label: "Total Proposals", value: stats.proposals.total,    color: "#6d28d9", trend: proposalTrend,              delta: "+12%" },
          { label: "Accepted",        value: stats.proposals.accepted,  color: "#16a34a", trend: [3,5,4,6,7,9,11,stats.proposals.accepted], delta: "+8%" },
          { label: "Rejected",        value: stats.proposals.rejected,  color: "#dc2626", trend: [2,3,2,4,3,5,6,stats.proposals.rejected],  delta: "-3%" },
          { label: "Pending Review",  value: stats.proposals.pending,   color: "#d97706", trend: [4,6,5,8,7,10,12,stats.proposals.pending],  delta: "+5%" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={S.card()}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,.10)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,.05)"; e.currentTarget.style.transform = "none"; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <p style={{ fontSize: 12, color: "#6b7280", fontWeight: 500, margin: 0 }}>{kpi.label}</p>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
                background: kpi.delta.startsWith("+") ? "#f0fdf4" : "#fef2f2",
                color: kpi.delta.startsWith("+") ? "#16a34a" : "#dc2626",
              }}>{kpi.delta}</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#111", margin: "8px 0 12px", letterSpacing: "-.03em" }}>
              <AnimatedNumber value={kpi.value} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div style={{ width: 4, height: 32, background: kpi.color, borderRadius: 4 }} />
              <Sparkline data={kpi.trend} color={kpi.color} />
            </div>
          </div>
        ))}
      </div>

      {/* ── ROW 2: Projects + Budget + Messages ─────── */}
      <div style={S.grid3}>

        {/* Active Projects */}
        <div className="bg-purple-600 text-white rounded-2xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition duration-300">
          <p className="text-xs text-purple-200 font-medium">Active Projects</p>
          <div className="text-4xl font-extrabold mt-2 mb-4 tracking-tight">
            <AnimatedNumber value={stats.projects.active} />
          </div>
          <div className="flex gap-3">
            {[
              { label: "Completed", val: stats.projects.completed },
              { label: "On Hold",   val: stats.projects.onHold },
              { label: "Total",     val: stats.projects.total },
            ].map((s) => (
              <div key={s.label} className="flex-1 text-center bg-white/10 backdrop-blur-sm rounded-xl py-2">
                <div className="text-lg font-bold">{s.val}</div>
                <div className="text-[10px] text-purple-200">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div
          style={S.card()}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,.10)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,.05)"; e.currentTarget.style.transform = "none"; }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 12, color: "#6b7280", margin: 0, fontWeight: 500 }}>Budget Released</p>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#111", margin: "6px 0", letterSpacing: "-.03em" }}>
                {fmtCr(stats.budget.released)}
              </div>
              <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>of {fmtCr(stats.budget.sanctioned)} sanctioned</p>
            </div>
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <RingProgress pct={budgetPct} size={80} stroke={7} color="#16a34a" />
              <div style={{ position: "absolute", fontSize: 13, fontWeight: 800, color: "#16a34a" }}>{budgetPct}%</div>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: "#6b7280" }}>Utilization</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#16a34a" }}>{budgetPct}%</span>
            </div>
            <div style={{ height: 6, background: "#f3f4f6", borderRadius: 99 }}>
              <div style={{
                height: "100%", background: "linear-gradient(90deg,#16a34a,#4ade80)",
                borderRadius: 99, width: `${budgetPct}%`,
                transition: "width 1.4s cubic-bezier(.4,0,.2,1)",
              }} />
            </div>
          </div>
        </div>

        {/* Messages summary */}
        <div
          style={S.card()}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,.10)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,.05)"; e.currentTarget.style.transform = "none"; }}
        >
          <p style={{ fontSize: 12, color: "#6b7280", margin: 0, fontWeight: 500 }}>Messages</p>
          <div style={{ fontSize: 38, fontWeight: 800, color: "#111", margin: "6px 0 14px", letterSpacing: "-.04em" }}>
            <AnimatedNumber value={stats.messages.total} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Unread", val: stats.messages.unread, color: "#6d28d9", bg: "#f5f3ff" },
              { label: "Sent",   val: stats.messages.sent,   color: "#2563eb", bg: "#eff6ff" },
            ].map((m) => (
              <div key={m.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: m.bg, borderRadius: 10, padding: "8px 12px",
              }}>
                <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>{m.label}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: m.color }}>{m.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 3: Recent Projects + Recent Messages ── */}
      <div style={S.grid2}>

        {/* Recent Projects */}
        <div style={S.card({ padding: 0 })}>
          <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111" }}>Recent Projects</h2>
            <button style={{
              background: "none", border: "1px solid #e5e7eb", borderRadius: 8,
              padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#6b7280", cursor: "pointer",
            }}>View all →</button>
          </div>
          <div style={{ padding: "0 10px 10px" }}>
            {recentProjects.map((proj, i) => (
              <div key={i}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", borderRadius: 12, cursor: "pointer", transition: "background .15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: `hsl(${i * 70 + 240},60%,92%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 800, color: `hsl(${i * 70 + 240},50%,40%)`,
                }}>{proj.name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{proj.name}</span>
                    <Badge label={proj.status} color={statusColors[proj.status] || "purple"} />
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>{proj.phase} · {proj.lead}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 4, background: "#f3f4f6", borderRadius: 99 }}>
                      <div style={{
                        height: "100%", borderRadius: 99, width: `${proj.progress}%`,
                        background: proj.progress === 100 ? "#2563eb" : proj.progress > 50 ? "#6d28d9" : "#d97706",
                      }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", flexShrink: 0 }}>{proj.progress}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Messages */}
        <div style={S.card({ padding: 0 })}>
          <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111" }}>Recent Messages</h2>
            <div style={{ background: "#f5f3ff", color: "#6d28d9", borderRadius: 999, fontSize: 10, fontWeight: 700, padding: "3px 9px" }}>
              {stats.messages.unread} unread
            </div>
          </div>
          <div style={{ padding: "0 10px 10px" }}>
            {recentMessages.map((m, i) => (
              <div key={i}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", borderRadius: 12, cursor: "pointer", transition: "background .15s", background: m.unread ? "#fdf8ff" : "transparent" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                onMouseLeave={e => e.currentTarget.style.background = m.unread ? "#fdf8ff" : "transparent"}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg,#6d28d9,#8b5cf6)",
                  color: "#fff", fontWeight: 700, fontSize: 14,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{m.name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: m.unread ? 700 : 500, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.subject}</span>
                    <Badge label={m.tag} color={tagColors[m.tag] || "blue"} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{m.from}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      {m.unread && <Dot active />}
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>{m.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 4: Proposal Breakdown ──────────────── */}
      <div style={S.card({ marginBottom: 20 })}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111" }}>Proposal Breakdown</h2>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "Accepted", val: stats.proposals.accepted, color: "#16a34a" },
              { label: "Rejected", val: stats.proposals.rejected, color: "#dc2626" },
              { label: "Pending",  val: stats.proposals.pending,  color: "#d97706" },
            ].map((p) => (
              <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6b7280" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
                {p.label}: <strong style={{ color: "#111" }}>{p.val}</strong>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", height: 10, borderRadius: 99, overflow: "hidden", gap: 2 }}>
          {[
            { pct: stats.proposals.total ? (stats.proposals.accepted / stats.proposals.total) * 100 : 0, color: "#16a34a" },
            { pct: stats.proposals.total ? (stats.proposals.rejected / stats.proposals.total) * 100 : 0, color: "#dc2626" },
            { pct: stats.proposals.total ? (stats.proposals.pending  / stats.proposals.total) * 100 : 0, color: "#d97706" },
          ].map((s, i) => (
            <div key={i} style={{
              width: `${s.pct}%`, background: s.color, borderRadius: 99,
              transition: "width 1.4s cubic-bezier(.4,0,.2,1)",
            }} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>Total: {stats.proposals.total} proposals</span>
          <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>
            {stats.proposals.total
              ? Math.round((stats.proposals.accepted / stats.proposals.total) * 100)
              : 0}% acceptance rate
          </span>
        </div>
      </div>

    </main>
  );
}