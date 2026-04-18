import { useState, useEffect } from "react";
import axios from "axios";

const API = axios.create({ baseURL: "http://127.0.0.1:8000" });

interface CabinetProps {
  onBack: () => void;
}

export default function Cabinet({ onBack }: CabinetProps) {
  const [page, setPage] = useState<"login" | "register" | "dashboard">("login");
  const [token, setToken] = useState("");
  const [user, setUser] = useState<any>(null);
  const [myApps, setMyApps] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [error, setError] = useState("");

  // форма входа
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // форма регистрации
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regRegion, setRegRegion] = useState("");
  const [regPass, setRegPass] = useState("");

  // форма подачи заявки
  const [applyProgram, setApplyProgram] = useState(0);
  const [applyScore, setApplyScore] = useState("");
  const [applyWave, setApplyWave] = useState(1);
  const [applySource, setApplySource] = useState("site");
  const [applyMsg, setApplyMsg] = useState("");

  // детали заявки
  const [selectedApp, setSelectedApp] = useState<any>(null);

  const headers = { Authorization: `Bearer ${token}` };

  const loadData = async () => {
    try {
      const [appsRes, progsRes, profileRes] = await Promise.all([
        API.get("/cabinet/my-applications", { headers }),
        API.get("/programs/"),
        API.get("/cabinet/profile", { headers }),
      ]);
      setMyApps(appsRes.data);
      setPrograms(progsRes.data);
      setUser(profileRes.data);
    } catch {
      setError("Ошибка загрузки данных");
    }
  };

  useEffect(() => {
    if (page === "dashboard" && token) loadData();
  }, [page, token]);

  const handleLogin = async () => {
    setError("");
    try {
      const res = await API.post("/auth/login", { email: loginEmail, password: loginPass });
      setToken(res.data.access_token);
      setUser({ full_name: res.data.full_name, id: res.data.applicant_id });
      setPage("dashboard");
    } catch (e: any) {
      setError(e.response?.data?.detail || "Ошибка входа");
    }
  };

  const handleRegister = async () => {
    setError("");
    try {
      const res = await API.post("/auth/register", {
        full_name: regName,
        email: regEmail,
        phone: regPhone || undefined,
        region: regRegion || undefined,
        password: regPass,
      });
      setToken(res.data.access_token);
      setUser({ full_name: res.data.full_name, id: res.data.applicant_id });
      setPage("dashboard");
    } catch (e: any) {
      setError(e.response?.data?.detail || "Ошибка регистрации");
    }
  };

  const handleApply = async () => {
    setApplyMsg("");
    setError("");
    try {
      await API.post(
        "/cabinet/apply",
        {
          applicant_id: user.id,
          program_id: applyProgram,
          source: applySource,
          wave: applyWave,
          score: parseFloat(applyScore),
        },
        { headers }
      );
      setApplyMsg("Заявка подана!");
      loadData();
    } catch (e: any) {
      setError(e.response?.data?.detail || "Ошибка подачи заявки");
    }
  };

  const loadAppDetail = async (appId: number) => {
    try {
      const res = await API.get(`/cabinet/application/${appId}`, { headers });
      setSelectedApp(res.data);
    } catch {
      setError("Ошибка загрузки деталей");
    }
  };

  const programName = (id: number) => programs.find((p) => p.id === id)?.name || `#${id}`;

  // === СТРАНИЦА ВХОДА ===
  if (page === "login") {
    return (
      <div className="container">
        <div className="header-bar">
          <h1>Личный кабинет абитуриента</h1>
          <button className="btn-back" onClick={onBack}>← Дашборд комиссии</button>
        </div>
        <div className="auth-form">
          <h2>Вход</h2>
          {error && <div className="error-msg">{error}</div>}
          <input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
          <input type="password" placeholder="Пароль" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} />
          <button className="btn-primary" onClick={handleLogin}>Войти</button>
          <p className="auth-switch" onClick={() => { setPage("register"); setError(""); }}>
            Нет аккаунта? Регистрация
          </p>
          <p className="auth-hint">Тестовый вход: email любого абитуриента из базы, пароль: password123</p>
        </div>
      </div>
    );
  }

  // === СТРАНИЦА РЕГИСТРАЦИИ ===
  if (page === "register") {
    return (
      <div className="container">
        <div className="header-bar">
          <h1>Личный кабинет абитуриента</h1>
          <button className="btn-back" onClick={onBack}>← Дашборд комиссии</button>
        </div>
        <div className="auth-form">
          <h2>Регистрация</h2>
          {error && <div className="error-msg">{error}</div>}
          <input placeholder="ФИО" value={regName} onChange={(e) => setRegName(e.target.value)} />
          <input type="email" placeholder="Email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
          <input placeholder="Телефон (+7XXXXXXXXXX)" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
          <input placeholder="Регион" value={regRegion} onChange={(e) => setRegRegion(e.target.value)} />
          <input type="password" placeholder="Пароль (мин. 6 символов)" value={regPass} onChange={(e) => setRegPass(e.target.value)} />
          <button className="btn-primary" onClick={handleRegister}>Зарегистрироваться</button>
          <p className="auth-switch" onClick={() => { setPage("login"); setError(""); }}>
            Уже есть аккаунт? Войти
          </p>
        </div>
      </div>
    );
  }

  // === ЛИЧНЫЙ КАБИНЕТ ===
  return (
    <div className="container">
      <div className="header-bar">
        <h1>Личный кабинет: {user?.full_name}</h1>
        <div>
          <button className="btn-back" onClick={onBack}>← Дашборд комиссии</button>
          <button className="btn-logout" onClick={() => { setToken(""); setPage("login"); setUser(null); }}>
            Выйти
          </button>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* Мои заявки */}
      <h2>Мои заявки ({myApps.length})</h2>
      {myApps.length === 0 ? (
        <p>У вас пока нет заявок. Подайте первую заявку ниже.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Программа</th>
              <th>Баллы</th>
              <th>Волна</th>
              <th>Статус</th>
              <th>Дата подачи</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {myApps.map((a) => (
              <tr key={a.id}>
                <td>{programName(a.program_id)}</td>
                <td>{a.score}</td>
                <td>{a.wave}</td>
                <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                <td>{new Date(a.created_at).toLocaleDateString("ru-RU")}</td>
                <td><button className="btn-small" onClick={() => loadAppDetail(a.id)}>Подробнее</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Детали заявки */}
      {selectedApp && (
        <div className="app-detail">
          <h3>Заявка: {selectedApp.program} ({selectedApp.faculty})</h3>
          <div className="detail-grid">
            <div><strong>Статус:</strong> <span className={`badge badge-${selectedApp.status}`}>{selectedApp.status}</span></div>
            <div><strong>Баллы ЕГЭ:</strong> {selectedApp.score}</div>
            <div><strong>Волна:</strong> {selectedApp.wave}</div>
            <div><strong>Источник:</strong> {selectedApp.source}</div>
          </div>
          <h4>История статусов:</h4>
          <div className="status-timeline">
            {selectedApp.history.map((h: any, i: number) => (
              <div key={i} className="timeline-item">
                <div className={`timeline-dot dot-${h.new_status}`}></div>
                <div>
                  <strong>{h.old_status || "—"} → {h.new_status}</strong>
                  <div className="timeline-date">{new Date(h.changed_at).toLocaleString("ru-RU")}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="btn-small" onClick={() => setSelectedApp(null)}>Закрыть</button>
        </div>
      )}

      {/* Подать заявку */}
      <h2>Подать заявку</h2>
      <div className="apply-form">
        {applyMsg && <div className="success-msg">{applyMsg}</div>}
        <select value={applyProgram} onChange={(e) => setApplyProgram(Number(e.target.value))}>
          <option value={0}>Выберите программу</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.faculty})</option>
          ))}
        </select>
        <input type="number" placeholder="Сумма баллов ЕГЭ" value={applyScore} onChange={(e) => setApplyScore(e.target.value)} />
        <select value={applyWave} onChange={(e) => setApplyWave(Number(e.target.value))}>
          <option value={1}>1 волна</option>
          <option value={2}>2 волна</option>
        </select>
        <select value={applySource} onChange={(e) => setApplySource(e.target.value)}>
          <option value="site">Сайт</option>
          <option value="olymp">Олимпиада</option>
          <option value="aggregator">Агрегатор</option>
          <option value="other">Другое</option>
        </select>
        <button className="btn-primary" onClick={handleApply} disabled={!applyProgram || !applyScore}>
          Отправить заявку
        </button>
      </div>
    </div>
  );
}
