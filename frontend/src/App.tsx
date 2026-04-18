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

  useEffect(() => {
    if (mode === "dashboard") {
      fetchMetrics().then((res) => setMetrics(res.data));
      fetchByProgram().then((res) => setPrograms(res.data));
      fetchApplications({}).then((res) => setApplications(res.data));
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
    <div className="container">
      <div className="header-bar">
        <h1>Мониторинг приёмной кампании РТУ МИРЭА</h1>
        <button className="btn-cabinet" onClick={() => setMode("cabinet")}>
          Личный кабинет абитуриента
        </button>
      </div>

      {metrics && (
        <div className="cards">
          <div className="card">
            <div className="card-value">{metrics.total_applications}</div>
            <div className="card-label">Всего заявок</div>
          </div>
          <div className="card card-green">
            <div className="card-value">{metrics.enrolled}</div>
            <div className="card-label">Зачислено</div>
          </div>
          <div className="card card-red">
            <div className="card-value">{metrics.rejected}</div>
            <div className="card-label">Отклонено</div>
          </div>
          <div className="card card-blue">
            <div className="card-value">{metrics.conversion_rate}%</div>
            <div className="card-label">Конверсия</div>
          </div>
        </div>
      )}

      <h2>Конверсия по программам</h2>
      <table>
        <thead>
          <tr>
            <th>Программа</th>
            <th>Институт</th>
            <th>Заявок</th>
            <th>Зачислено</th>
            <th>Конверсия</th>
          </tr>
        </thead>
        <tbody>
          {programs.map((p) => (
            <tr key={p.program_id}>
              <td>{p.program_name}</td>
              <td>{p.faculty}</td>
              <td>{p.total}</td>
              <td>{p.enrolled}</td>
              <td>{p.conversion_rate}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Заявки</h2>
      <div className="filters">
        <select value={statusFilter} onChange={(e) => handleFilter(e.target.value)}>
          <option value="">Все статусы</option>
          <option value="new">Новые</option>
          <option value="review">На рассмотрении</option>
          <option value="enrolled">Зачислены</option>
          <option value="rejected">Отклонены</option>
        </select>
        <button onClick={exportCSV}>Экспорт CSV</button>
      </div>

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
          {applications.map((a) => (
            <tr key={a.id}>
              <td>{a.id}</td>
              <td>{a.applicant_id}</td>
              <td>{a.program_id}</td>
              <td>
                <span className={`badge badge-${a.status}`}>{a.status}</span>
              </td>
              <td>{a.score}</td>
              <td>{a.wave}</td>
              <td>{a.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
