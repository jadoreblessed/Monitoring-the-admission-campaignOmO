import {
  Users,
  UserCheck,
  TrendingUp,
  UserX
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { useEffect, useState } from "react";
import { fetchMetrics, fetchByProgram, fetchApplications, fetchByDate, fetchBySource, exportCSV } from "./api";
import Cabinet from "./Cabinet";
import "./App.css";

// ─────────────────────────────────────────────
// Константы
// ─────────────────────────────────────────────
const statusLabel: Record<string, string> = {
  new: "Новая", review: "Рассмотрение", enrolled: "Зачислен", rejected: "Отклонён",
};
const sourceLabel: Record<string, string> = {
  site: "Сайт", olymp: "Олимпиада", aggregator: "Агрегатор", other: "Другое",
};

// ─────────────────────────────────────────────
// Skeleton-компоненты
// ─────────────────────────────────────────────

/** Базовый скелетон-блок с анимацией пульсации */
function Skeleton({ width = "100%", height = 16, radius = 6, style = {} }: {
  width?: string | number;
  height?: number;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

/** Скелетон для карточек метрик (4 штуки) */
function MetricCardsSkeleton() {
  return (
    <div className="top-row">
      {[...Array(4)].map((_, i) => (
        <div className="card" key={i}>
          <div className="card-ring" style={{ gap: 12 }}>
            <Skeleton width={36} height={36} radius={8} />
            <div style={{ flex: 1 }}>
              <Skeleton width="60%" height={28} radius={6} style={{ marginBottom: 8 }} />
              <Skeleton width="80%" height={12} radius={4} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Скелетон для графиков (строка из трёх панелей) */
function ChartRowSkeleton() {
  return (
    <div className="charts-row" style={{ marginBottom: 12 }}>
      {[...Array(3)].map((_, i) => (
        <div className="panel chart-panel" key={i}>
          <div className="panel-head-row">
            <Skeleton width="40%" height={14} radius={4} />
          </div>
          <div className="chart-body">
            <Skeleton width="100%" height={160} radius={8} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Скелетон для списка программ */
function ProgramListSkeleton() {
  return (
    <div className="panel" style={{ marginBottom: 12 }}>
      <div className="panel-head-row">
        <Skeleton width="35%" height={14} radius={4} />
      </div>
      <div className="prog-list">
        {[...Array(5)].map((_, i) => (
          <div className="prog" key={i}>
            <div className="prog-top" style={{ marginBottom: 6 }}>
              <Skeleton width="55%" height={13} radius={4} />
              <Skeleton width={36} height={13} radius={4} />
            </div>
            <Skeleton width="30%" height={11} radius={4} style={{ marginBottom: 8 }} />
            <Skeleton width="100%" height={3} radius={2} style={{ marginBottom: 4 }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Skeleton width="25%" height={11} radius={4} />
              <Skeleton width="20%" height={11} radius={4} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Скелетон для графика конверсии */
function BarChartSkeleton() {
  return (
    <div className="panel chart-panel" style={{ marginBottom: 16 }}>
      <div className="panel-head-row">
        <Skeleton width="30%" height={14} radius={4} />
      </div>
      <div className="chart-body">
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 220, padding: "8px 0" }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
              <Skeleton
                width="100%"
                height={Math.floor(60 + Math.random() * 140)}
                radius={4}
              />
              <Skeleton width="70%" height={10} radius={3} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Скелетон для таблицы заявок */
function TableSkeleton() {
  return (
    <div className="panel">
      <div className="panel-head-row">
        <Skeleton width="20%" height={14} radius={4} />
        <div style={{ display: "flex", gap: 8 }}>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} width={90} height={30} radius={6} />
          ))}
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {["ID", "Абитуриент", "Программа", "Статус", "Баллы", "Волна", "Источник", "Дата"].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(8)].map((_, i) => (
              <tr key={i}>
                <td><Skeleton width={30} height={13} radius={3} /></td>
                <td><Skeleton width="80%" height={13} radius={3} /></td>
                <td><Skeleton width="90%" height={13} radius={3} /></td>
                <td><Skeleton width={70} height={22} radius={5} /></td>
                <td><Skeleton width={40} height={13} radius={3} /></td>
                <td><Skeleton width={20} height={13} radius={3} /></td>
                <td><Skeleton width={60} height={13} radius={3} /></td>
                <td><Skeleton width={70} height={13} radius={3} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MiniLineChart
// ─────────────────────────────────────────────
function MiniLineChart({ data }: { data: { date: string; count: number }[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const W = 400, H = 130, pad = 12;
  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - 20 - ((d.count / max) * (H - pad * 2 - 20));
    return `${x},${y}`;
  }).join(" ");
  const areaPoints = `${pad},${H - pad - 20} ` + points + ` ${W - pad},${H - pad - 20}`;
  const labelIndices = data.reduce((acc: number[], _, i) => {
    if (i % Math.ceil(data.length / 5) === 0 || i === data.length - 1) acc.push(i);
    return acc;
  }, []);
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
        const y = H - pad - 20 - ((d.count / max) * (H - pad * 2 - 20));
        return <circle key={i} cx={x} cy={y} r="2" fill="#4f7ef8" />;
      })}
      {labelIndices.map(i => {
        const x = pad + (i / (data.length - 1)) * (W - pad * 2);
        return <text key={i} x={x} y={H - 4} textAnchor="middle" fontSize="10" fill="#7a849e">{data[i].date}</text>;
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────
// SourcesPieChart
// ─────────────────────────────────────────────
function SourcesPieChart({ data }: { data: { source: string; count: number }[] }) {
  if (!data || data.length === 0) return <div className="donut-empty">Нет данных</div>;
  const PIE_COLORS = ["#2563eb", "#22c55e", "#f59e0b", "#ef4444"];
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="source" cx="50%" cy="50%" innerRadius={60} outerRadius={80} label>
          {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: '#13161e', borderColor: '#252a38', color: '#e8ecf4' }} />
        <Legend formatter={(value) => sourceLabel[value] || value} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────
// ConversionBarChart — оптимизированный
// ─────────────────────────────────────────────

/**
 * При количестве программ > 50 график «слипается».
 * Решение:
 *   1. Минимальная ширина на одну группу столбцов — BAR_GROUP_WIDTH пикселей.
 *   2. Если суммарная ширина превышает контейнер — включается горизонтальный скролл.
 *   3. Угол подписей масштабируется от -20° до -45° при росте числа программ.
 *   4. При >30 программах подписи на XAxis скрываются, вместо них — кастомный Tooltip.
 */
const BAR_GROUP_WIDTH = 48; // минимальная ширина (px) на одну группу
const LABEL_HIDE_THRESHOLD = 30; // при >30 программах убираем подписи оси X

function ConversionBarChart({ programs }: { programs: any[] }) {
  const count = programs.length;

  // Вычисляем необходимую ширину
  const minWidth = count * BAR_GROUP_WIDTH;

  // Угол подписей: чем больше программ, тем круче угол
  const labelAngle = count > 20 ? -45 : -20;

  // Высота отведённая под подписи оси X
  const xAxisHeight = count > LABEL_HIDE_THRESHOLD ? 20 : 80;

  // Интервал меток: показываем каждую N-ю
  const interval = count > LABEL_HIDE_THRESHOLD
    ? Math.ceil(count / 15) - 1   // показываем ~15 меток максимум
    : 0;                            // показываем все

  return (
    <div
      className="bar-chart-scroll"
      style={{ overflowX: count > LABEL_HIDE_THRESHOLD ? "auto" : "visible" }}
    >
      {/* Подсказка при большом числе программ */}
      {count > LABEL_HIDE_THRESHOLD && (
        <div className="bar-chart-hint">
          Показано {count} программ — прокрутите вправо для просмотра всех
        </div>
      )}

      <div style={{ minWidth: Math.max(minWidth, 300), width: "100%" }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={programs}
            margin={{ top: 4, right: 8, left: 0, bottom: xAxisHeight }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2e3447" vertical={false} />
            <XAxis
              dataKey="program_name"
              fontSize={count > 30 ? 9 : 11}
              angle={labelAngle}
              textAnchor="end"
              height={xAxisHeight}
              stroke="#7a849e"
              interval={interval}
              tick={{ fill: "#7a849e" }}
            />
            <YAxis stroke="#7a849e" tick={{ fill: "#7a849e" }} width={36} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#13161e",
                borderColor: "#252a38",
                color: "#e8ecf4",
                borderRadius: "8px",
                fontSize: 12,
              }}
              /* При большом числе программ Tooltip — единственный способ прочитать название */
              formatter={(value, name) => [value, name === "total" ? "Заявок" : "Зачислено"]}
              labelStyle={{ color: "#93c5fd", fontWeight: 600, marginBottom: 4 }}
            />
            <Bar dataKey="total"    fill="#93c5fd" name="Заявок"    radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="enrolled" fill="#22c55e" name="Зачислено" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Главный компонент App
// ─────────────────────────────────────────────
const PAGE_SIZE = 20;

function App() {
  const [mode, setMode] = useState<"dashboard" | "cabinet">("dashboard");

  // Состояния загрузки
  const [metricsLoading, setMetricsLoading]   = useState(true);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [appsLoading, setAppsLoading]         = useState(true);
  const [chartsLoading, setChartsLoading]     = useState(true);

  const [metrics, setMetrics]               = useState<any>(null);
  const [programs, setPrograms]             = useState<any[]>([]);
  const [applications, setApplications]     = useState<any[]>([]);
  const [totalApplications, setTotalApplications] = useState(0);
  const [chartData, setChartData]           = useState<any[]>([]);
  const [sourceData, setSourceData]         = useState<any[]>([]);

  const [statusFilter, setStatusFilter] = useState("");
  const [waveFilter,   setWaveFilter]   = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [dateFilter,   setDateFilter]   = useState("");
  const [page, setPage]                 = useState(0);
  const [menuOpen, setMenuOpen]         = useState(false);

  useEffect(() => {
    if (mode === "dashboard") {
      // Метрики
      setMetricsLoading(true);
      fetchMetrics()
        .then(r => setMetrics(r.data))
        .finally(() => setMetricsLoading(false));

      // Программы
      setProgramsLoading(true);
      fetchByProgram()
        .then(r => setPrograms(r.data))
        .finally(() => setProgramsLoading(false));

      // Графики
      setChartsLoading(true);
      Promise.all([fetchByDate(30), fetchBySource()])
        .then(([dateRes, sourceRes]) => {
          setChartData(dateRes.data);
          setSourceData(sourceRes.data);
        })
        .finally(() => setChartsLoading(false));

      loadApplications({});
    }
  }, [mode]);

  const loadApplications = (params: Record<string, string>) => {
    setPage(0);
    setAppsLoading(true);
    fetchApplications(params)
      .then(r => {
        const data = r.data;
        if (data.items) {
          setApplications(data.items);
          setTotalApplications(data.total);
        } else {
          setApplications(data);
          setTotalApplications(data.length);
        }
      })
      .finally(() => setAppsLoading(false));
  };

  const handleFilters = (status: string, wave: string, date: string, source: string) => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (wave)   params.wave   = wave;
    if (source) params.source = source;
    if (date) {
      const days = parseInt(date);
      const from = new Date();
      from.setDate(from.getDate() - days);
      params.created_after = from.toISOString().split("T")[0];
    }
    loadApplications(params);
  };

  const onStatusChange = (s: string) => { setStatusFilter(s); handleFilters(s, waveFilter, dateFilter, sourceFilter); };
  const onWaveChange   = (w: string) => { setWaveFilter(w);   handleFilters(statusFilter, w, dateFilter, sourceFilter); };
  const onDateChange   = (d: string) => { setDateFilter(d);   handleFilters(statusFilter, waveFilter, d, sourceFilter); };
  const onSourceChange = (s: string) => { setSourceFilter(s); handleFilters(statusFilter, waveFilter, dateFilter, s); };

  if (mode === "cabinet") return <Cabinet onBack={() => setMode("dashboard")} />;

  const paged      = applications.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(applications.length / PAGE_SIZE);

  return (
    <div className="app-wrapper">
      {/* Боковое меню */}
      <aside className="sidebar desktop-only">
        <div className="sidebar-header">МПК РТУ МИРЭА</div>
        <nav className="sidebar-nav">
          <div className="sidebar-link active" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Дашборд</div>
          <div className="sidebar-link" onClick={() => document.querySelector(".table-scroll")?.scrollIntoView({ behavior: "smooth" })}>Заявки</div>
          <div className="sidebar-link" onClick={() => document.querySelector(".prog-list")?.scrollIntoView({ behavior: "smooth" })}>Программы</div>
          <div className="sidebar-link" onClick={exportCSV}>Экспорт</div>
        </nav>
      </aside>

      <div className="main-wrapper">
        <nav className="topbar">
          <div className="topbar-left">
            <button className="btn-burger mobile-only" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
            <div className="topbar-info">
              <span className="topbar-title">Мониторинг Приёмной Кампании</span>
            </div>
          </div>
          <button className="btn-lk desktop-only" onClick={() => setMode("cabinet")}>ЛК Абитуриента</button>
        </nav>

        {menuOpen && (
          <div className="mobile-menu">
            <button onClick={() => { setMode("cabinet"); setMenuOpen(false); }}>ЛК Абитуриента</button>
          </div>
        )}

        <main className="content">
          <div className="page-header">
            <h2 className="content-title">Обзор кампании</h2>
          </div>

          {/* ── Метрики ── */}
          {metricsLoading ? (
            <MetricCardsSkeleton />
          ) : metrics && (
            <div className="top-row">
              <div className="card">
                <div className="card-ring">
                  <Users size={36} color="#2563eb" />
                  <div className="ring-center">
                    <span className="card-num">{metrics?.total_applications || 0}</span>
                    <span className="card-desc">Всего заявок</span>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-ring">
                  <UserCheck size={36} color="#22c55e" />
                  <div className="ring-center">
                    <span className="card-num green">{metrics?.enrolled || 0}</span>
                    <span className="card-desc">Зачислено</span>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-ring">
                  <TrendingUp size={36} color="#f59e0b" />
                  <div className="ring-center">
                    <span className="card-num orange">{metrics?.in_review || 0}</span>
                    <span className="card-desc">На рассмотрении</span>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-ring">
                  <UserX size={36} color="#ef4444" />
                  <div className="ring-center">
                    <span className="card-num red">{metrics?.rejected || 0}</span>
                    <span className="card-desc">Отклонено</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Строка графиков ── */}
          {chartsLoading ? (
            <ChartRowSkeleton />
          ) : (
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
                  <SourcesPieChart data={sourceData} />
                </div>
              </div>
              <div className="panel chart-panel">
                <div className="panel-head-row">
                  <span className="panel-title">Статусы</span>
                </div>
                {metrics && (
                  <div className="status-bars">
                    {[
                      { key: "new",      label: "Новые",        val: metrics.new,       cls: "blue"   },
                      { key: "review",   label: "Рассмотрение", val: metrics.in_review, cls: "orange" },
                      { key: "enrolled", label: "Зачислены",    val: metrics.enrolled,  cls: "green"  },
                      { key: "rejected", label: "Отклонены",    val: metrics.rejected,  cls: "red"    },
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
                            style={{ width: metrics.total_applications ? `${(val / metrics.total_applications) * 100}%` : "0%" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Список программ ── */}
          {programsLoading ? (
            <ProgramListSkeleton />
          ) : (
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
          )}

          {/* ── График конверсии (оптимизированный) ── */}
          {programsLoading ? (
            <BarChartSkeleton />
          ) : (
            <div className="panel chart-panel" style={{ marginBottom: 16 }}>
              <div className="panel-head-row">
                <span className="panel-title">График конверсии</span>
                <span className="panel-hint">{programs.length} программ</span>
              </div>
              <div className="chart-body">
                <ConversionBarChart programs={programs} />
              </div>
            </div>
          )}

          {/* ── Таблица заявок ── */}
          {appsLoading ? (
            <TableSkeleton />
          ) : (
            <div className="panel">
              <div className="panel-head-row">
                <span className="panel-title">
                  Заявки
                  <span className="count-badge">{totalApplications}</span>
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
                        <td>{a.applicant_name ?? a.applicant_id}</td>
                        <td>{a.program_name ?? a.program_id}</td>
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
          )}
        </main>

        <footer className="foot">
          <span>© 2026 РТУ МИРЭА — Мониторинг Приёмной Кампании</span>
          <span>Зырянов В.А.</span>
        </footer>
      </div>
    </div>
  );
}

export default App;
