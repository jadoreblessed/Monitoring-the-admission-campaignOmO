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
  const [showModal, setShowModal] = useState(false);

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
  const [animateStatus, setAnimateStatus] = useState<number | null>(null);

  // редактирование профиля
  const [editingProfile, setEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRegion, setEditRegion] = useState("");

  const headers = { Authorization: `Bearer ${token}` };

  // Получение первой буквы для аватарки
  const getAvatarLetter = () => {
    return user?.full_name?.charAt(0)?.toUpperCase() || "?";
  };

  // Статус заявки для прогресс-бара
  const getStatusStep = (status: string) => {
    const steps = ["new", "review", "enrolled", "rejected"];
    return steps.indexOf(status);
  };

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
    } catch (err) {
      setError("Ошибка загрузки данных");
    }
  };

  useEffect(() => {
    if (page === "dashboard" && token) loadData();
  }, [page, token]);

  const handleLogin = async () => {
    setError("");
    try {
      const res = await API.post("/cabinet/auth/login", { email: loginEmail, password: loginPass });
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
      const res = await API.post("/cabinet/auth/register", {
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
      setShowModal(false);
      loadData();
      setApplyProgram(0);
      setApplyScore("");
    } catch (e: any) {
      setError(e.response?.data?.detail || "Ошибка подачи заявки");
    }
  };

  const handleCancelApplication = async (appId: number) => {
    if (!confirm("Вы уверены, что хотите отменить заявку?")) return;
    setError("");
    try {
      await API.delete(`/cabinet/application/${appId}`, { headers });
      setAnimateStatus(appId);
      setTimeout(() => setAnimateStatus(null), 500);
      loadData();
      if (selectedApp?.id === appId) setSelectedApp(null);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Ошибка отмены заявки");
    }
  };

  const handleUpdateProfile = async () => {
    setError("");
    try {
      const updates: any = {};
      if (editFullName && editFullName !== user?.full_name) updates.full_name = editFullName;
      if (editPhone !== user?.phone) updates.phone = editPhone || null;
      if (editRegion !== user?.region) updates.region = editRegion || null;
      
      await API.put("/cabinet/profile", updates, { headers });
      await loadData();
      setEditingProfile(false);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Ошибка обновления профиля");
    }
  };

  const startEditingProfile = () => {
    setEditFullName(user?.full_name || "");
    setEditPhone(user?.phone || "");
    setEditRegion(user?.region || "");
    setEditingProfile(true);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "#ffc107";
      case "review": return "#17a2b8";
      case "enrolled": return "#28a745";
      case "rejected": return "#dc3545";
      default: return "#6c757d";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "new": return "Новая";
      case "review": return "На рассмотрении";
      case "enrolled": return "Зачислен";
      case "rejected": return "Отклонён";
      default: return status;
    }
  };

  // СТРАНИЦА ВХОДА
  if (page === "login") {
    return (
      <div className="cabinet-container">
        <div className="cabinet-header">
          <h1>🎓 Личный кабинет абитуриента</h1>
          <button className="btn-back-large" onClick={onBack}>← Дашборд комиссии</button>
        </div>
        <div className="auth-card">
          <h2>Вход</h2>
          {error && <div className="error-msg">{error}</div>}
          <input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
          <input type="password" placeholder="Пароль" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} />
          <button className="btn-primary" onClick={handleLogin}>Войти</button>
          <p className="auth-switch" onClick={() => { setPage("register"); setError(""); }}>
            Нет аккаунта? Регистрация
          </p>
        </div>
      </div>
    );
  }

  // СТРАНИЦА РЕГИСТРАЦИИ
  if (page === "register") {
    return (
      <div className="cabinet-container">
        <div className="cabinet-header">
          <h1>🎓 Личный кабинет абитуриента</h1>
          <button className="btn-back-large" onClick={onBack}>← Дашборд комиссии</button>
        </div>
        <div className="auth-card">
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

  // ЛИЧНЫЙ КАБИНЕТ
  return (
    <div className="cabinet-container">
      {/* Модальное окно подачи заявки */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>📝 Подать заявку</h3>
            <div className="modal-form">
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
              <div className="modal-buttons">
                <button className="btn-primary" onClick={handleApply} disabled={!applyProgram || !applyScore}>
                  Отправить
                </button>
                <button className="btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Шапка */}
      <div className="cabinet-header">
        <div className="header-left">
          <div className="avatar">{getAvatarLetter()}</div>
          <div>
            <h1>Привет, {user?.full_name?.split(" ")[0]}!</h1>
            <p className="user-email">{user?.email}</p>
          </div>
        </div>
        <div className="header-right">
          <button className="btn-apply" onClick={() => setShowModal(true)}>+ Подать заявку</button>
          <button className="btn-logout" onClick={() => { setToken(""); setPage("login"); setUser(null); }}>
            Выйти
          </button>
          <button className="btn-back" onClick={onBack}>← Дашборд</button>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* Профиль */}
      <div className="profile-section">
        <h2>📋 Мой профиль</h2>
        {!editingProfile ? (
          <div className="profile-card">
            <div className="profile-row"><strong>ФИО:</strong> {user?.full_name}</div>
            <div className="profile-row"><strong>Телефон:</strong> {user?.phone || "не указан"}</div>
            <div className="profile-row"><strong>Регион:</strong> {user?.region || "не указан"}</div>
            <button className="btn-edit" onClick={startEditingProfile}>✏ Редактировать</button>
          </div>
        ) : (
          <div className="profile-edit-card">
            <input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} placeholder="ФИО" />
            <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Телефон (+7XXXXXXXXXX)" />
            <input value={editRegion} onChange={(e) => setEditRegion(e.target.value)} placeholder="Регион" />
            <div className="profile-edit-buttons">
              <button className="btn-primary" onClick={handleUpdateProfile}>Сохранить</button>
              <button className="btn-secondary" onClick={() => setEditingProfile(false)}>Отмена</button>
            </div>
          </div>
        )}
      </div>

      {/* Мои заявки - карточки */}
      <h2>📄 Мои заявки ({myApps.length})</h2>
      {myApps.length === 0 ? (
        <p className="empty-state">У вас пока нет заявок. Нажмите «Подать заявку»</p>
      ) : (
        <div className="cards-grid">
          {myApps.map((a) => (
            <div key={a.id} className={`application-card ${animateStatus === a.id ? "card-animate" : ""}`}>
              <div className="card-header" style={{ borderLeftColor: getStatusColor(a.status) }}>
                <h3>{programName(a.program_id)}</h3>
                <span className="badge" style={{ backgroundColor: getStatusColor(a.status) }}>
                  {getStatusText(a.status)}
                </span>
              </div>
              
              {/* Прогресс-бар статуса */}
              <div className="progress-steps">
                {["new", "review", "enrolled", "rejected"].map((step, idx) => (
                  <div key={step} className={`step ${getStatusStep(a.status) >= idx ? "active" : ""} ${a.status === "rejected" && step === "rejected" ? "rejected" : ""}`}>
                    <div className="step-dot"></div>
                    <div className="step-label">{step === "new" ? "Новая" : step === "review" ? "Рассмотрение" : step === "enrolled" ? "Зачисление" : "Отказ"}</div>
                  </div>
                ))}
              </div>

              <div className="card-details">
                <div><strong>Баллы ЕГЭ:</strong> {a.score || "—"}</div>
                <div><strong>Волна:</strong> {a.wave}</div>
                <div><strong>Дата:</strong> {new Date(a.created_at).toLocaleDateString("ru-RU")}</div>
              </div>

              <div className="card-buttons">
                <button className="btn-detail" onClick={() => loadAppDetail(a.id)}>Подробнее</button>
                {a.status !== "enrolled" && a.status !== "rejected" && (
                  <button className="btn-cancel" onClick={() => handleCancelApplication(a.id)}>Отозвать</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Детали заявки */}
      {selectedApp && (
        <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
          <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
            <h3>📌 Заявка: {selectedApp.program}</h3>
            <p><strong>Факультет:</strong> {selectedApp.faculty}</p>
            <p><strong>Статус:</strong> <span className="badge" style={{ backgroundColor: getStatusColor(selectedApp.status) }}>{getStatusText(selectedApp.status)}</span></p>
            <p><strong>Баллы:</strong> {selectedApp.score}</p>
            <p><strong>Волна:</strong> {selectedApp.wave}</p>
            <p><strong>Источник:</strong> {selectedApp.source}</p>
            <h4>История изменений:</h4>
            <div className="history-list">
              {selectedApp.history?.map((h: any, i: number) => (
                <div key={i} className="history-item">
                  <span className="history-status">{h.old_status || "—"} → {h.new_status}</span>
                  <span className="history-date">{new Date(h.changed_at).toLocaleString("ru-RU")}</span>
                </div>
              ))}
            </div>
            <button className="btn-close" onClick={() => setSelectedApp(null)}>Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
}