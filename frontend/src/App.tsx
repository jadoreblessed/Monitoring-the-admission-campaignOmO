import { useEffect, useState } from "react";
import { fetchMetrics, fetchByProgram, fetchApplications, exportCSV } from "./api";
import Cabinet from "./Cabinet";
import "./App.css";

const statusLabel: Record<string, string> = {
  new: "Новая", review: "Рассмотрение", enrolled: "Зачислен", rejected: "Отклонён",
};

const sourceLabel: Record<string, string> = {
  site: "Сайт", olymp: "Олимпиада", aggregator: "Агрегатор", other: "Другое",
};

function App() {
  const [mode, setMode] = useState<"dashboard" | "cabinet">("dashboard");
  const [metrics, setMetrics] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (mode === "dashboard") {
      fetchMetrics().then((r) => setMetrics(r.data));
      fetchByProgram().then((r) => setPrograms(r.data));
      fetchApplications({}).then((r) => setApplications(r.data));
    }
  }, [mode]);

  const handleFilter = (s: string) => {
    setStatusFilter(s);
    const params: Record<string, string> = s ? { status: s } : {};
    fetchApplications(params).then((r) => setApplications(r.data));
  };

  if (mode === "cabinet") {
    return <Cabinet onBack={() => setMode("dashboard")} />;
  }

  const convPct = metrics?.conversion_rate ?? 0;
  const ringDash = (convPct / 100) * 220;

  return (
    <div className="app">
      {/* Шапка */}
      <nav className="topbar">
        <div className="topbar-left">
          <div className="logo">МПК</div>
          <div className="topbar-info">
            <span className="topbar-title">Мониторинг Приёмной Кампании</span>
            <span className="topbar-sub">РТУ МИРЭА · 2026</span>
          </div>
        </div>
        <button className="btn-lk" onClick={() => setMode("cabinet")}>
          Личный кабинет
        </button>
      </nav>

      <main className="content">
        <h2 className="content-title">Обзор кампании</h2>

        {/* Метрики */}
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

        {/* Две колонки */}
        <div className="two-col">
          {/* Программы */}
          <div className="panel">
            <div className="panel-head-row">
              <span className="panel-title">Конверсия по программам</span>
            </div>
            <div className="prog-list">
              {programs.map((p) => (
                <div className="prog" key={p.program_id}>
                  <div className="prog-top">
                    <span className="prog-name">{p.program_name}</span>
                    <span className="prog-pct">{p.conversion_rate}%</span>
                  </div>
                  <div className="prog-faculty">{p.faculty}</div>
                  <div className="prog-bar-bg">
                    <div className="prog-bar-fill"
                      style={{ width: `${Math.min(p.conversion_rate, 100)}%` }} />
                  </div>
                  <div className="prog-nums">
                    <span>{p.enrolled} зачислено</span>
                    <span>{p.total} всего</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Статусы */}
          <div className="panel">
            <div className="panel-head-row">
              <span className="panel-title">Распределение по статусам</span>
            </div>
            {metrics && (
              <div className="status-bars">
                {[
                  { key: "new",      label: "Новые",           val: metrics.new,          cls: "blue"   },
                  { key: "review",   label: "На рассмотрении", val: metrics.in_review,    cls: "orange" },
                  { key: "enrolled", label: "Зачислены",       val: metrics.enrolled,     cls: "green"  },
                  { key: "rejected", label: "Отклонены",       val: metrics.rejected,     cls: "red"    },
                ].map(({ key, label, val, cls }) => (
                  <div className="sbar" key={key}>
                    <div className="sbar-head">
                      <span className={`sbar-dot ${cls}`} />
                      <span>{label}</span>
                      <span className="sbar-val">{val}</span>
                    </div>
                    <div className="sbar-bg">
                      <div
                        className={`sbar-fill ${cls}-bg`}
                        style={{ width: metrics.total_applications
                          ? `${(val / metrics.total_applications) * 100}%`
                          : "0%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Таблица заявок */}
        <div className="panel">
          <div className="panel-head-row">
            <span className="panel-title">Заявки</span>
            <div className="panel-controls">
              <select value={statusFilter} onChange={(e) => handleFilter(e.target.value)}>
                <option value="">Все статусы</option>
                <option value="new">Новые</option>
                <option value="review">На рассмотрении</option>
                <option value="enrolled">Зачислены</option>
                <option value="rejected">Отклонены</option>
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
                </tr>
              </thead>
              <tbody>
                {applications.slice(0, 50).map((a) => (
                  <tr key={a.id}>
                    <td className="td-mono">{a.id}</td>
                    <td>{a.applicant_id}</td>
                    <td>{a.program_id}</td>
                    <td>
                      <span className={`tag tag-${a.status}`}>
                        {statusLabel[a.status] || a.status}
                      </span>
                    </td>
                    <td className="td-mono">{a.score}</td>
                    <td className="td-mono">{a.wave}</td>
                    <td style={{ color: "var(--text2)", fontSize: "12px" }}>
                      {sourceLabel[a.source] || a.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="foot">
        <span>© 2026 РТУ МИРЭА — Мониторинг Приёмной Кампании</span>
        <span>Зырянов В.А.</span>
      </footer>
    </div>
  );
}

export default App;
