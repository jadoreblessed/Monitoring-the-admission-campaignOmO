import { useEffect, useState } from "react";
import { fetchMetrics, fetchByProgram, fetchApplications, fetchByDate, fetchBySource, exportCSV } from "./api";
import Cabinet from "./Cabinet";
import "./App.css";

const statusLabel: Record<string, string> = {
  new: "Новая", review: "Рассмотрение", enrolled: "Зачислен", rejected: "Отклонён",
};
const sourceLabel: Record<string, string> = {
  site: "Сайт", olymp: "Олимпиада", aggregator: "Агрегатор", other: "Другое",
};

function MiniLineChart({ data }: { data: { date: string; count: number }[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const W = 400, H = 130, pad = 12;
  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((d.count / max) * (H - pad * 2));
    return `${x},${y}`;
  }).join(" ");
  const areaPoints = `${pad},${H - pad} ` + points + ` ${W - pad},${H - pad}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="line-chart">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f7ef8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#4f7ef8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#chartGrad)" />
      <polyline points={points} fill="none" stroke="#4f7ef8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => {
        const x = pad + (i / (data.length - 1)) * (W - pad * 2);
        const y = H - pad - ((d.count / max) * (H - pad * 2));
        return <circle key={i} cx={x} cy={y} r="2" fill="#4f7ef8" />;
      })}
      {data.filter((_, i) => i % Math.ceil(data.length / 5) === 0 || i === data.length - 1).map((d, _, arr) => {
        const origI = data.indexOf(d);
        const x = pad + (origI / (data.length - 1)) * (W - pad * 2);
        return <text key={origI} x={x} y={H + 6} textAnchor="middle" fontSize="10" fill="#7a849e">{d.date}</text>;
      })}
    </svg>
  );
}

function DonutChart({ data }: { data: { source: string; count: number }[] }) {
  const colors = { site: "#4f7ef8", olymp: "#22c55e", aggregator: "#f59e0b", other: "#a78bfa" };
  const labels = { site: "Сайт", olymp: "Олимпиада", aggregator: "Агрегатор", other: "Другое" };
  const total = data.reduce((s, d) => s + d.count, 0);
  if (!total) return <div className="donut-empty">Нет данных</div>;

  let cumAngle = -90;
  const R = 50, r = 30, cx = 70, cy = 60;

  const slices = data.filter(d => d.count > 0).map(d => {
    const angle = (d.count / total) * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    const toRad = (a: number) => (a * Math.PI) / 180;
    const x1 = cx + R * Math.cos(toRad(startAngle));
    const y1 = cy + R * Math.sin(toRad(startAngle));
    const x2 = cx + R * Math.cos(toRad(cumAngle - 0.01));
    const y2 = cy + R * Math.sin(toRad(cumAngle - 0.01));
    const x3 = cx + r * Math.cos(toRad(cumAngle - 0.01));
    const y3 = cy + r * Math.sin(toRad(cumAngle - 0.01));
    const x4 = cx + r * Math.cos(toRad(startAngle));
    const y4 = cy + r * Math.sin(toRad(startAngle));
    const large = angle > 180 ? 1 : 0;
    return { d: `M${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} L${x3},${y3} A${r},${r} 0 ${large},0 ${x4},${y4} Z`, source: d.source, count: d.count };
  });

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 140 120" className="donut-svg">
        {slices.map(s => (
          <path key={s.source} d={s.d} fill={(colors as any)[s.source]} opacity="0.9" />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#e8ecf4">{total}</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="7" fill="#7a849e">заявок</text>
      </svg>
      <div className="donut-legend">
        {data.filter(d => d.count > 0).map(d => (
          <div key={d.source} className="donut-item">
            <span className="donut-dot" style={{ background: (colors as any)[d.source] }} />
            <span className="donut-label">{(labels as any)[d.source]}</span>
            <span className="donut-val">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;

function App() {
  const [mode, setMode] = useState<"dashboard" | "cabinet">("dashboard");
  const [metrics, setMetrics] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [sourceData, setSourceData] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [waveFilter, setWaveFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (mode === "dashboard") {
      fetchMetrics().then(r => setMetrics(r.data));
      fetchByProgram().then(r => setPrograms(r.data));
      fetchByDate(30).then(r => setChartData(r.data));
      fetchBySource().then(r => setSourceData(r.data));
      loadApplications({});
    }
  }, [mode]);

  const loadApplications = (params: Record<string, string>) => {
    setPage(0);
    fetchApplications(params).then(r => setApplications(r.data));
  };

  const handleFilters = (status: string, wave: string, date: string) => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (wave) params.wave = wave;
    if (date) {
      const days = parseInt(date);
      const from = new Date();
      from.setDate(from.getDate() - days);
      params.created_after = from.toISOString().split("T")[0];
    }
    loadApplications(params);
  };

  const onStatusChange = (s: string) => {
    setStatusFilter(s); handleFilters(s, waveFilter, dateFilter);
  };
  const onWaveChange = (w: string) => {
    setWaveFilter(w); handleFilters(statusFilter, w, dateFilter);
  };
  const onDateChange = (d: string) => {
    setDateFilter(d); handleFilters(statusFilter, waveFilter, d);
  };

  if (mode === "cabinet") return <Cabinet onBack={() => setMode("dashboard")} />;

  const convPct = metrics?.conversion_rate ?? 0;
  const ringDash = (convPct / 100) * 220;
  const paged = applications.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(applications.length / PAGE_SIZE);

  return (
    <div className="app">
      <nav className="topbar">
        <div className="topbar-left">
          <div className="logo">МПК</div>
          <div className="topbar-info">
            <span className="topbar-title">Мониторинг Приёмной Кампании</span>
            <span className="topbar-sub">РТУ МИРЭА · 2026</span>
          </div>
        </div>
        <button className="btn-lk desktop-only" onClick={() => setMode("cabinet")}>Личный кабинет</button>
        <button className="btn-burger mobile-only" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
      </nav>

      {menuOpen && (
        <div className="mobile-menu">
          <button onClick={() => { setMode("cabinet"); setMenuOpen(false); }}>Личный кабинет</button>
        </div>
      )}

      <main className="content">
        <div className="page-header">
          <h2 className="content-title">Обзор кампании</h2>
        </div>

        {metrics && (
          <div className="top-row">
            <div className="card card-ring">
              <svg className="ring" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="35" fill="none" stroke="#252a38" strokeWidth="7" />
                <circle cx="45" cy="45" r="35" fill="none" stroke="#4f7ef8" strokeWidth="7"
                  strokeDasharray={`${ringDash} 220`} strokeLinecap="round"
                  transform="rotate(-90 45 45)" />
              </svg>
              <div className="ring-center">
                <span className="ring-value">{convPct}%</span>
                <span className="ring-label">Конверсия</span>
              </div>
            </div>
            <div className="card">
              <span className="card-num">{metrics.total_applications}</span>
              <span className="card-desc">Всего заявок</span>
            </div>
            <div className="card">
              <span className="card-num green">{metrics.enrolled}</span>
              <span className="card-desc">Зачислено</span>
            </div>
            <div className="card">
              <span className="card-num orange">{metrics.in_review}</span>
              <span className="card-desc">На рассмотрении</span>
            </div>
            <div className="card">
              <span className="card-num red">{metrics.rejected}</span>
              <span className="card-desc">Отклонено</span>
            </div>
          </div>
        )}

        {/* Графики */}
        <div className="charts-row">
          <div className="panel chart-panel">
            <div className="panel-head-row">
              <span className="panel-title">Динамика заявок</span>
              <span className="panel-hint">за 30 дней</span>
            </div>
            <div className="chart-body">
              <MiniLineChart data={chartData} />
            </div>
          </div>

          <div className="panel chart-panel">
            <div className="panel-head-row">
              <span className="panel-title">По источникам</span>
            </div>
            <div className="chart-body">
              <DonutChart data={sourceData} />
            </div>
          </div>

          <div className="panel chart-panel">
            <div className="panel-head-row">
              <span className="panel-title">Статусы</span>
            </div>
            {metrics && (
              <div className="status-bars">
                {[
                  { key: "new",      label: "Новые",           val: metrics.new,       cls: "blue"   },
                  { key: "review",   label: "Рассмотрение",    val: metrics.in_review, cls: "orange" },
                  { key: "enrolled", label: "Зачислены",       val: metrics.enrolled,  cls: "green"  },
                  { key: "rejected", label: "Отклонены",       val: metrics.rejected,  cls: "red"    },
                ].map(({ key, label, val, cls }) => (
                  <div className="sbar" key={key}>
                    <div className="sbar-head">
                      <span className={`sbar-dot ${cls}`} />
                      <span>{label}</span>
                      <span className="sbar-val">{val}</span>
                    </div>
                    <div className="sbar-bg">
                      <div className={`sbar-fill ${cls}-bg`}
                        style={{ width: metrics.total_applications ? `${(val / metrics.total_applications) * 100}%` : "0%" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Программы */}
        <div className="panel" style={{ marginBottom: 12 }}>
          <div className="panel-head-row">
            <span className="panel-title">Конверсия по программам</span>
          </div>
          <div className="prog-list">
            {programs.map(p => (
              <div className="prog" key={p.program_id}>
                <div className="prog-top">
                  <span className="prog-name">{p.program_name}</span>
                  <span className="prog-pct">{p.conversion_rate}%</span>
                </div>
                <div className="prog-faculty">{p.faculty}</div>
                <div className="prog-bar-bg">
                  <div className="prog-bar-fill" style={{ width: `${Math.min(p.conversion_rate, 100)}%` }} />
                </div>
                <div className="prog-nums">
                  <span>{p.enrolled} зачислено</span>
                  <span>{p.total} всего</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Таблица */}
        <div className="panel">
          <div className="panel-head-row">
            <span className="panel-title">
              Заявки
              <span className="count-badge">{applications.length}</span>
            </span>
            <div className="panel-controls">
              <select value={statusFilter} onChange={e => onStatusChange(e.target.value)}>
                <option value="">Все статусы</option>
                <option value="new">Новые</option>
                <option value="review">На рассмотрении</option>
                <option value="enrolled">Зачислены</option>
                <option value="rejected">Отклонены</option>
              </select>
              <select value={waveFilter} onChange={e => onWaveChange(e.target.value)}>
                <option value="">Все волны</option>
                <option value="1">Волна 1</option>
                <option value="2">Волна 2</option>
              </select>
              <select value={dateFilter} onChange={e => onDateChange(e.target.value)}>
                <option value="">Любая дата</option>
                <option value="7">За 7 дней</option>
                <option value="30">За 30 дней</option>
                <option value="60">За 60 дней</option>
              </select>
              <button className="btn-export" onClick={exportCSV}>Экспорт</button>
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Абитуриент</th>
                  <th>Программа</th>
                  <th>Статус</th>
                  <th>Баллы</th>
                  <th>Волна</th>
                  <th>Источник</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(a => (
                  <tr key={a.id}>
                    <td className="td-mono">{a.id}</td>
                    <td>{a.applicant_id}</td>
                    <td>{a.program_id}</td>
                    <td><span className={`tag tag-${a.status}`}>{statusLabel[a.status] || a.status}</span></td>
                    <td className="td-mono">{a.score}</td>
                    <td className="td-mono">{a.wave}</td>
                    <td className="td-muted">{sourceLabel[a.source] || a.source}</td>
                    <td className="td-mono td-muted">
                      {a.created_at ? new Date(a.created_at).toLocaleDateString("ru-RU") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn-page" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>←</button>
              <span className="page-info">{page + 1} / {totalPages}</span>
              <button className="btn-page" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>→</button>
            </div>
          )}
        </div>
      </main>

      <footer className="foot">
        <span>© 2026 РТУ МИРЭА — Мониторинг Приёмной Кампании</span>
      </footer>
    </div>
  );
}

export default App;
