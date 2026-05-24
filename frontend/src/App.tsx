import { useState, useEffect } from "react";
import {
  fetchMetrics,
  fetchByProgram,
  fetchBySource,
  fetchByDate,
  fetchApplications,
  fetchApplicants,
  fetchPrograms,
} from "./api";
import Cabinet from "./Cabinet";
import "./App.css";

function App() {
  const [showCabinet, setShowCabinet] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [byProgram, setByProgram] = useState<any[]>([]);
  const [bySource, setBySource] = useState<any[]>([]);
  const [byDate, setByDate] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [applicantMap, setApplicantMap] = useState<Record<number, string>>({});
  const [programMap, setProgramMap] = useState<Record<number, string>>({});
  const [filters, setFilters] = useState({
    status: "",
    source: "",
    wave: "",
    program_id: "",
  });

  useEffect(() => {
    fetchMetrics().then((res) => setMetrics(res.data));
    fetchByProgram().then((res) => setByProgram(res.data));
    fetchBySource().then((res) => setBySource(res.data));
    fetchByDate(30).then((res) => setByDate(res.data));
    loadApplications();
    loadMaps();
  }, []);

  const loadApplications = async () => {
    const params: Record<string, string> = {};
    if (filters.status) params.status = filters.status;
    if (filters.source) params.source = filters.source;
    if (filters.wave) params.wave = filters.wave;
    if (filters.program_id) params.program_id = filters.program_id;
    const res = await fetchApplications(params);
    setApplications(res.data);
  };

  const loadMaps = async () => {
    const [applicantsRes, programsRes] = await Promise.all([
      fetchApplicants(),
      fetchPrograms(),
    ]);
    const aMap: Record<number, string> = {};
    applicantsRes.data.forEach((a: any) => {
      aMap[a.id] = a.full_name;
    });
    const pMap: Record<number, string> = {};
    programsRes.data.forEach((p: any) => {
      pMap[p.id] = p.name;
    });
    setApplicantMap(aMap);
    setProgramMap(pMap);
  };

  useEffect(() => {
    loadApplications();
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: "", source: "", wave: "", program_id: "" });
  };

  if (showCabinet) {
    return <Cabinet onBack={() => setShowCabinet(false)} />;
  }

  return (
    <div className="app">
      <div className="dashboard-header">
        <h1>📊 Дашборд приёмной комиссии</h1>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowCabinet(true)}>
            👤 Личный кабинет
          </button>
        </div>
      </div>

      {/* Метрики */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Всего заявок</h3>
          <div className="metric-value">{metrics?.total_applications || 0}</div>
        </div>
        <div className="metric-card">
          <h3>Зачислено</h3>
          <div className="metric-value">{metrics?.total_enrolled || 0}</div>
        </div>
        <div className="metric-card">
          <h3>Конверсия</h3>
          <div className="metric-value">{metrics?.conversion_rate || 0}%</div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="filters-bar">
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
        >
          <option value="">Все статусы</option>
          <option value="new">Новая</option>
          <option value="review">На рассмотрении</option>
          <option value="enrolled">Зачислен</option>
          <option value="rejected">Отклонён</option>
        </select>

        <select
          value={filters.source}
          onChange={(e) => handleFilterChange("source", e.target.value)}
        >
          <option value="">Все источники</option>
          <option value="site">Сайт</option>
          <option value="olymp">Олимпиада</option>
          <option value="aggregator">Агрегатор</option>
          <option value="other">Другое</option>
        </select>

        <select
          value={filters.wave}
          onChange={(e) => handleFilterChange("wave", e.target.value)}
        >
          <option value="">Все волны</option>
          <option value="1">1 волна</option>
          <option value="2">2 волна</option>
        </select>

        <button className="btn-secondary" onClick={clearFilters}>
          Сбросить фильтры
        </button>
      </div>

      {/* Таблица заявок */}
      <h2>Заявки ({applications.length})</h2>
      {applications.length === 0 ? (
        <p>Нет заявок</p>
      ) : (
        <table className="applications-table">
          <thead>
            <tr>
              <th>Абитуриент</th>
              <th>Программа</th>
              <th>Баллы</th>
              <th>Волна</th>
              <th>Статус</th>
              <th>Источник</th>
              <th>Дата</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((a) => (
              <tr key={a.id}>
                <td>{applicantMap[a.applicant_id] || a.applicant_id}</td>
                <td>{programMap[a.program_id] || a.program_id}</td>
                <td>{a.score}</td>
                <td>{a.wave}</td>
                <td>
                  <span className={`badge badge-${a.status}`}>{a.status}</span>
                </td>
                <td>{a.source}</td>
                <td>{new Date(a.created_at).toLocaleDateString("ru-RU")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;