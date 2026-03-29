import { useEffect, useState } from "react";
import { fetchMetrics, fetchByProgram, fetchApplications, exportCSV } from "./api";
import "./App.css";

function App() {
  const [metrics, setMetrics] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");

  // загружаем данные при открытии страницы
  useEffect(() => {
    fetchMetrics().then((res) => setMetrics(res.data));
    fetchByProgram().then((res) => setPrograms(res.data));
    fetchApplications({}).then((res) => setApplications(res.data));
  }, []);

  // фильтрация по статусу
  const handleFilter = (status: string) => {
    setStatusFilter(status);
    const params = status ? { status } : {};
    fetchApplications(params).then((res) => setApplications(res.data));
  };

  return (
    <div className="container">
      <h1>Мониторинг приёмной кампании РТУ МИРЭА</h1>

      {/* Карточки метрик */}
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
          <div className="card card-blue">
            <div className="card-value">{metrics.conversion_rate}%</div>
            <div className="card-label">Конверсия</div>
          </div>
        </div>
      )}

      {/* Конверсия по программам */}
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

      {/* Фильтры + экспорт */}
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

      {/* Таблица заявок */}
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