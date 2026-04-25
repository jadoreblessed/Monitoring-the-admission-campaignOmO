import { useEffect, useState } from "react";
import { fetchMetrics, fetchByProgram, fetchApplications, exportCSV } from "./api";
import Cabinet from "./Cabinet";
import "./App.css";

function App() {
  const [mode, setMode] = useState<"dashboard" | "cabinet">("dashboard");
  const [metrics, setMetrics] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [showHero, setShowHero] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (mode === "dashboard") {
      Promise.all([
        fetchMetrics().then((res) => setMetrics(res.data)),
        fetchByProgram().then((res) => setPrograms(res.data)),
        fetchApplications({}).then((res) => setApplications(res.data)),
      ]).then(() => setLoaded(true));
    }
  }, [mode]);

  const handleFilter = (status: string) => {
    setStatusFilter(status);
    const params = status ? { status } : {};
    fetchApplications(params).then((res) => setApplications(res.data));
  };

  if (mode === "cabinet") {
    return <Cabinet onBack={() => setMode("dashboard")} />;
  }

  return (
    <div className="app-root">
      {showHero && (
        <div className="hero">
          <div className="hero-overlay" />
          <video className="hero-video" autoPlay muted loop playsInline
            poster="https://images.unsplash.com/photo-1562774053-701939374585?w=1920&q=80">
            <source src="https://cdn.coverr.co/videos/coverr-aerial-view-of-city-at-night-2559/1080p.mp4" type="video/mp4" />
          </video>
          <div className="hero-content">
            <div className="hero-badge">РТУ МИРЭА • Приёмная кампания 2025</div>
            <h1 className="hero-title">Мониторинг<br /><span className="hero-accent">Приёмной Кампании</span></h1>
            <p className="hero-subtitle">Аналитика конверсии в реальном времени.<br/>Дашборд для приёмной комиссии и личный кабинет абитуриента.</p>
            <div className="hero-buttons">
              <button className="btn-hero" onClick={() => setShowHero(false)}>Открыть дашборд</button>
              <button className="btn-hero-outline" onClick={() => setMode("cabinet")}>Личный кабинет</button>
            </div>
            {metrics && (
              <div className="hero-stats">
                <div className="hero-stat">
                  <span className="hero-stat-value">{metrics.total_applications}</span>
                  <span className="hero-stat-label">заявок</span>
                </div>
                <div className="hero-stat-divider" />
                <div className="hero-stat">
                  <span className="hero-stat-value">{metrics.enrolled}</span>
                  <span className="hero-stat-label">зачислено</span>
                </div>
                <div className="hero-stat-divider" />
                <div className="hero-stat">
                  <span className="hero-stat-value">{metrics.conversion_rate}%</span>
                  <span className="hero-stat-label">конверсия</span>
                </div>
              </div>
            )}
          </div>
          <div className="hero-scroll" onClick={() => setShowHero(false)}>
            <span>Перейти к дашборду</span>
            <div className="hero-arrow">↓</div>
          </div>
        </div>
      )}

      {!showHero && (
        <div className={`dashboard ${loaded ? "fade-in" : ""}`}>
          <header className="dash-header">
            <div className="dash-header-left">
              <div className="dash-logo" onClick={() => setShowHero(true)}>МПК</div>
              <h1 className="dash-title">Мониторинг Приёмной Кампании</h1>
            </div>
            <div className="dash-header-right">
              <button className="btn-cabinet" onClick={() => setMode("cabinet")}>👤 Личный кабинет</button>
            </div>
          </header>

          <div className="dash-content">
            {metrics && (
              <div className="metric-cards">
                <div className="metric-card"><div className="metric-icon mi-total">📋</div><div className="metric-info"><div className="metric-value">{metrics.total_applications}</div><div className="metric-label">Всего заявок</div></div></div>
                <div className="metric-card"><div className="metric-icon mi-new">🆕</div><div className="metric-info"><div className="metric-value">{metrics.new}</div><div className="metric-label">Новые</div></div></div>
                <div className="metric-card"><div className="metric-icon mi-review">🔍</div><div className="metric-info"><div className="metric-value">{metrics.in_review}</div><div className="metric-label">На рассмотрении</div></div></div>
                <div className="metric-card"><div className="metric-icon mi-enrolled">✅</div><div className="metric-info"><div className="metric-value">{metrics.enrolled}</div><div className="metric-label">Зачислено</div></div></div>
                <div className="metric-card"><div className="metric-icon mi-rejected">❌</div><div className="metric-info"><div className="metric-value">{metrics.rejected}</div><div className="metric-label">Отклонено</div></div></div>
                <div className="metric-card mc-accent"><div className="metric-icon mi-conv">📈</div><div className="metric-info"><div className="metric-value">{metrics.conversion_rate}%</div><div className="metric-label">Конверсия</div></div></div>
              </div>
            )}

            <section className="dash-section">
              <h2 className="section-title"><span className="section-icon">🎓</span> Конверсия по программам</h2>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Программа</th><th>Институт</th><th>Заявок</th><th>Зачислено</th><th>Конверсия</th></tr></thead>
                  <tbody>
                    {programs.map((p, i) => (
                      <tr key={p.program_id} className={i % 2 === 0 ? "row-even" : ""}>
                        <td className="td-program">{p.program_name}</td>
                        <td className="td-faculty">{p.faculty}</td>
                        <td className="td-num">{p.total}</td>
                        <td className="td-num">{p.enrolled}</td>
                        <td className="td-num">
                          <div className="conv-bar-wrapper">
                            <div className="conv-bar" style={{ width: `${Math.min(p.conversion_rate, 100)}%` }} />
                            <span className="conv-text">{p.conversion_rate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="dash-section">
              <h2 className="section-title"><span className="section-icon">📝</span> Заявки</h2>
              <div className="filters">
                <select className="filter-select" value={statusFilter} onChange={(e) => handleFilter(e.target.value)}>
                  <option value="">Все статусы</option>
                  <option value="new">🆕 Новые</option>
                  <option value="review">🔍 На рассмотрении</option>
                  <option value="enrolled">✅ Зачислены</option>
                  <option value="rejected">❌ Отклонены</option>
                </select>
                <button className="btn-export" onClick={exportCSV}>📥 Экспорт CSV</button>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>ID</th><th>Абитуриент</th><th>Программа</th><th>Статус</th><th>Баллы</th><th>Волна</th><th>Источник</th></tr></thead>
                  <tbody>
                    {applications.slice(0, 50).map((a, i) => (
                      <tr key={a.id} className={i % 2 === 0 ? "row-even" : ""}>
                        <td className="td-num">{a.id}</td>
                        <td>{a.applicant_id}</td>
                        <td>{a.program_id}</td>
                        <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                        <td className="td-num">{a.score}</td>
                        <td className="td-num">{a.wave}</td>
                        <td className="td-source">{a.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <footer className="dash-footer">
            <span>© 2026 РТУ МИРЭА — Мониторинг Приёмной Кампании</span>
            <span>Team Lead: Зырянов Владислав Александрович</span>
          </footer>
        </div>
      )}
    </div>
  );
}

export default App;
