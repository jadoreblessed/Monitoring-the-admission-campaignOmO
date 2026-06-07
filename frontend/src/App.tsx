import { useEffect, useState } from "react";
import {
  fetchMetrics,
  fetchByProgram,
  fetchApplications,
  fetchByDate,
  fetchBySource,
  fetchPrograms,
  exportCSV,
} from "./api";
import Cabinet from "./Cabinet";
import "./App.css";

/* ── helpers ── */
const STATUS_MAP: Record<string, string> = {
  new: "Новая",
  review: "Рассмотрение",
  enrolled: "Зачислен",
  rejected: "Отклонён",
};
const STATUS_CLASS: Record<string, string> = {
  new: "st-new",
  review: "st-review",
  enrolled: "st-enrolled",
  rejected: "st-rejected",
};
const SOURCE_MAP: Record<string, string> = {
  site: "Сайт",
  olymp: "Олимпиада",
  aggregator: "Агрегатор",
  other: "Другое",
};
const SOURCE_COLORS: Record<string, string> = {
  site: "#5b8def",
  olymp: "#22c55e",
  aggregator: "#f59e0b",
  other: "#a78bfa",
};

/* ── Donut chart (pure SVG) ── */
function DonutChart({ data }: { data: { source: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (!total) return null;
  const cx = 90, cy = 90, r = 70, sw = 28;
  let offset = 0;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="donut-wrap">
      <svg width={180} height={180} viewBox="0 0 180 180">
        {data.map((d) => {
          const pct = d.count / total;
          const dash = pct * circumference;
          const gap = circumference - dash;
          const rot = offset * 360 - 90;
          offset += pct;
          return (
            <circle
              key={d.source}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={SOURCE_COLORS[d.source] || "#666"}
              strokeWidth={sw}
              strokeDasharray={`${dash} ${gap}`}
              transform={`rotate(${rot} ${cx} ${cy})`}
              style={{ transition: "stroke-dasharray 0.6s ease" }}
            />
          );
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#fff" fontSize="28" fontWeight="800">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#8d97a8" fontSize="11">
          заявок
        </text>
      </svg>
      <div className="donut-legend">
        {data.map((d) => (
          <div key={d.source} className="legend-row">
            <span className="legend-dot" style={{ background: SOURCE_COLORS[d.source] }} />
            <span className="legend-label">{SOURCE_MAP[d.source] || d.source}</span>
            <strong className="legend-val">{d.count}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Sparkline (SVG) ── */
function Sparkline({ data }: { data: { date: string; count: number }[] }) {
  if (!data.length) return <div className="sparkline-empty">Нет данных за период</div>;
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const w = 500, h = 120, pad = 20;
  const step = (w - 2 * pad) / Math.max(data.length - 1, 1);

  const points = data.map((d, i) => ({
    x: pad + i * step,
    y: h - pad - ((d.count / maxVal) * (h - 2 * pad)),
  }));
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${points[points.length - 1].x},${h - pad} L${points[0].x},${h - pad} Z`;

  // date labels
  const labelIdxs = data.length <= 6
    ? data.map((_, i) => i)
    : [0, Math.floor(data.length / 4), Math.floor(data.length / 2), Math.floor((3 * data.length) / 4), data.length - 1];

  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} className="sparkline-svg">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5b8def" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#5b8def" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#areaGrad)" />
      <path d={line} fill="none" stroke="#5b8def" strokeWidth="2" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#5b8def" />
      ))}
      {labelIdxs.map((idx) => (
        <text key={idx} x={points[idx].x} y={h + 12} textAnchor="middle" fill="#6b7280" fontSize="10">
          {data[idx].date.slice(5).replace("-", ".")}
        </text>
      ))}
    </svg>
  );
}

/* ── Sidebar ── */
function Sidebar({ mode, onSetMode }: { mode: string; onSetMode: (m: any) => void }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="brand">
          <div className="logo-box">МПК</div>
        </div>
      </div>
      <nav className="nav">
        <button className={`nav-item ${mode === "dashboard" ? "active" : ""}`} onClick={() => onSetMode("dashboard")} title="Обзор">
          <span className="icon">🏠</span>
        </button>
        <button className={`nav-item ${mode === "applications" ? "active" : ""}`} onClick={() => onSetMode("applications")} title="Заявки">
          <span className="icon">📄</span>
        </button>
        <button className={`nav-item ${mode === "programs" ? "active" : ""}`} onClick={() => onSetMode("programs")} title="Программы">
          <span className="icon">📚</span>
        </button>
        <div className="nav-spacer" />
        <button className={`nav-item ${mode === "cabinet" ? "active" : ""}`} onClick={() => onSetMode("cabinet")} title="Личный кабинет">
          <span className="avatar">👤</span>
        </button>
      </nav>
    </aside>
  );
}

/* ── App ── */
export default function App() {
  const [mode, setMode] = useState<"dashboard" | "cabinet" | "applications" | "programs">("dashboard");

  const [metrics, setMetrics] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [sourceData, setSourceData] = useState<any[]>([]);
  const [dateData, setDateData] = useState<any[]>([]);
  const [allPrograms, setAllPrograms] = useState<any[]>([]);

  // Filters for applications table
  const [filterStatus, setFilterStatus] = useState("");
  const [filterWave, setFilterWave] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [appPage, setAppPage] = useState(0);
  const APP_PER_PAGE = 15;

  // Applicant names cache
  const [applicantNames, setApplicantNames] = useState<Record<number, string>>({});

  const loadAll = () => {
    fetchMetrics().then((r) => setMetrics(r.data));
    fetchByProgram().then((r) => setPrograms(r.data));
    fetchBySource().then((r) => setSourceData(r.data));
    fetchByDate(30).then((r) => setDateData(r.data));
    fetchPrograms().then((r) => setAllPrograms(r.data));
    loadApps();
  };

  const loadApps = () => {
    const params: Record<string, string> = {};
    if (filterStatus) params.status = filterStatus;
    if (filterWave) params.wave = filterWave;
    if (filterSource) params.source = filterSource;
    fetchApplications(params).then((r) => {
      setApps(r.data.items ?? r.data);
      setAppPage(0);
    });
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    loadApps();
  }, [filterStatus, filterWave, filterSource]);

  // Load applicant names for visible apps
  useEffect(() => {
    if (!apps.length) return;
    const ids = [...new Set(apps.map((a) => a.applicant_id))].filter((id) => !applicantNames[id]);
    if (!ids.length) return;
    import("./api").then(({ default: API }) => {
      Promise.all(ids.map((id) => API.get(`/applicants/${id}`).catch(() => null))).then((results) => {
        const names: Record<number, string> = { ...applicantNames };
        results.forEach((r) => {
          if (r?.data) names[r.data.id] = r.data.full_name;
        });
        setApplicantNames(names);
      });
    });
  }, [apps]);

  const programNameById = (id: number) => {
    const p = allPrograms.find((p: any) => p.id === id);
    return p ? p.name : `#${id}`;
  };

  const renderDashboard = () => (
  <div className="dash-content">
    {/* Title */}
    <div className="dash-title-row">
      <div>
        <h1 className="dash-h1">Обзор кампании</h1>
      </div>
    </div>

    {/* Top metrics */}
    <div className="metrics-row">
      <div className="metric-card metric-conv">
        <div className="metric-ring">
          <svg width="54" height="54" viewBox="0 0 54 54">
            <circle cx="27" cy="27" r="22" fill="none" stroke="#1e2330" strokeWidth="5" />
            <circle
              cx="27" cy="27" r="22" fill="none" stroke="#5b8def" strokeWidth="5"
              strokeDasharray={`${(metrics?.conversion_rate || 0) / 100 * 138} 138`}
              transform="rotate(-90 27 27)"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div>
          <div className="metric-val">{metrics?.conversion_rate ?? 0}%</div>
          <div className="metric-label">Конверсия</div>
        </div>
      </div>
      <div className="metric-card">
        <div className="metric-val metric-white">{metrics?.total_applications ?? 0}</div>
        <div className="metric-label">Всего заявок</div>
      </div>
      <div className="metric-card">
        <div className="metric-val metric-green">{metrics?.enrolled ?? 0}</div>
        <div className="metric-label">Зачислено</div>
      </div>
      <div className="metric-card">
        <div className="metric-val metric-yellow">{metrics?.in_review ?? 0}</div>
        <div className="metric-label">На рассмотрении</div>
      </div>
      <div className="metric-card">
        <div className="metric-val metric-red">{metrics?.rejected ?? 0}</div>
        <div className="metric-label">Отклонено</div>
      </div>
    </div>

    {/* Charts row */}
    <div className="charts-row">
      <div className="chart-panel chart-spark">
        <div className="panel-head-row">
          <h3>Динамика заявок</h3>
          <span className="panel-hint">за 30 дней</span>
        </div>
        <Sparkline data={dateData} />
      </div>
      <div className="chart-panel chart-donut">
        <h3>По источникам</h3>
        <DonutChart data={sourceData} />
      </div>
      <div className="chart-panel chart-statuses">
        <h3>Статусы</h3>
        <div className="status-list">
          <div className="status-row">
            <span className="s-dot" style={{ background: "#7aa4ff" }} />
            <span>Новые</span>
            <strong className="s-val" style={{ color: "#7aa4ff" }}>{metrics?.new ?? 0}</strong>
          </div>
          <div className="status-row">
            <span className="s-dot" style={{ background: "#f59e0b" }} />
            <span>Рассмотрение</span>
            <strong className="s-val" style={{ color: "#f59e0b" }}>{metrics?.in_review ?? 0}</strong>
          </div>
          <div className="status-row">
            <span className="s-dot" style={{ background: "#22c55e" }} />
            <span>Зачислены</span>
            <strong className="s-val" style={{ color: "#22c55e" }}>{metrics?.enrolled ?? 0}</strong>
          </div>
          <div className="status-row">
            <span className="s-dot" style={{ background: "#ef4444" }} />
            <span>Отклонены</span>
            <strong className="s-val" style={{ color: "#ef4444" }}>{metrics?.rejected ?? 0}</strong>
          </div>
        </div>
      </div>
    </div>
  </div>
);

  const renderApplications = () => {
    const visible = apps.slice(appPage * APP_PER_PAGE, (appPage + 1) * APP_PER_PAGE);
    const totalPages = Math.ceil(apps.length / APP_PER_PAGE);
    return (
      <div className="dash-content">
        <div className="panel-head-row" style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>
            Заявки <span className="badge-count">{apps.length}</span>
          </h2>
          <div className="filters-row">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">Все статусы</option>
              <option value="new">Новая</option>
              <option value="review">Рассмотрение</option>
              <option value="enrolled">Зачислен</option>
              <option value="rejected">Отклонён</option>
            </select>
            <select value={filterWave} onChange={(e) => setFilterWave(e.target.value)}>
              <option value="">Все волны</option>
              <option value="1">1 волна</option>
              <option value="2">2 волна</option>
            </select>
            <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
              <option value="">Любой источник</option>
              <option value="site">Сайт</option>
              <option value="olymp">Олимпиада</option>
              <option value="aggregator">Агрегатор</option>
              <option value="other">Другое</option>
            </select>
            <button className="btn-export" onClick={exportCSV}>Экспорт ↓</button>
          </div>
        </div>
        <div className="apps-table">
          <div className="apps-thead">
            <span>ID</span>
            <span>АБИТУРИЕНТ</span>
            <span>ПРОГРАММА</span>
            <span>СТАТУС</span>
            <span>БАЛЛЫ</span>
            <span>ВОЛНА</span>
            <span>ИСТОЧНИК</span>
            <span>ДАТА</span>
          </div>
          {visible.map((a) => (
            <div className="apps-trow" key={a.id}>
              <span className="app-id">{a.id}</span>
              <span>{a.applicant_name || applicantNames[a.applicant_id] || `#${a.applicant_id}`}</span>
              <span className="app-prog">{a.program_name || programNameById(a.program_id)}</span>
              <span>
                <span className={`status-chip ${STATUS_CLASS[a.status]}`}>
                  {STATUS_MAP[a.status] || a.status}
                </span>
              </span>
              <span>{a.score ?? "—"}</span>
              <span>{a.wave}</span>
              <span>{SOURCE_MAP[a.source] || a.source}</span>
              <span>{a.created_at ? new Date(a.created_at).toLocaleDateString("ru-RU") : "—"}</span>
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="pagination">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} className={`page-btn ${appPage === i ? "active" : ""}`} onClick={() => setAppPage(i)}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPrograms = () => (
    <div className="dash-content">
      <h2>Конверсия по <span style={{ color: "var(--accent)" }}>программам</span></h2>
      <div className="programs-panel" style={{ marginTop: 16 }}>
        {programs.length > 0
          ? programs.map((p) => {
              const pct = p.conversion_rate || 0;
              return (
                <div key={p.program_id} className="prog-row-detailed">
                  <div className="prog-header">
                    <span className="prog-title">{p.program_name}</span>
                    <span className="prog-percent" style={{ color: pct > 0 ? "#5b8def" : "#ef4444" }}>{pct}%</span>
                  </div>
                  <div className="prog-insitute">{p.faculty}</div>
                  <div className="prog-progress-bg">
                    <div className="prog-progress-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <div className="prog-footer">
                    <span>{p.enrolled || 0} зачислено</span>
                    <span>{p.total || 0} всего</span>
                  </div>
                </div>
              );
            })
          : <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Загрузка...</div>}
      </div>
    </div>
  );

  const renderMainContent = () => {
    if (mode === "cabinet") return <Cabinet onBack={() => setMode("dashboard")} />;
    if (mode === "applications") return renderApplications();
    if (mode === "programs") return renderPrograms();
    return renderDashboard();
  };

  return (
    <div className="glass-root">
      <Sidebar mode={mode} onSetMode={setMode} />
      <div className="main-wrapper">
        <header className="glass-header">
          <div className="header-brand">
            <span className="header-title">Мониторинг Приёмной Кампании</span>
            <span className="header-sub">РТУ МИРЭА · 2026</span>
          </div>
          <button className="btn-lk-glass" onClick={() => setMode("cabinet")}>
            Личный кабинет
          </button>
        </header>
        <main className="content-area">{renderMainContent()}</main>
      </div>
    </div>
  );
}
