import { useState, useEffect } from "react";
import API from "./api";

interface CabinetProps {
  onBack: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  review: "Рассмотрение",
  enrolled: "Зачислен",
  rejected: "Отклонён",
};

const STATUS_COLORS: Record<string, string> = {
  new: "#7aa4ff",
  review: "#f59e0b",
  enrolled: "#22c55e",
  rejected: "#ef4444",
};

const SOURCE_LABELS: Record<string, string> = {
  site: "Сайт",
  olymp: "Олимпиада",
  aggregator: "Агрегатор",
  other: "Другое",
};

export default function Cabinet({ onBack }: CabinetProps) {
  const [page, setPage] = useState<"login" | "register" | "dashboard">("login");
  const [token, setToken] = useState(localStorage.getItem("mpk_token") || "");
  const [user, setUser] = useState<any>(null);
  const [myApps, setMyApps] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [error, setError] = useState("");

  // Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // Register
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regRegion, setRegRegion] = useState("");
  const [regPass, setRegPass] = useState("");

  // Apply form
  const [applyProgram, setApplyProgram] = useState(0);
  const [applyScore, setApplyScore] = useState("");
  const [applyWave, setApplyWave] = useState(1);
  const [applySource, setApplySource] = useState("site");
  const [applyHasOriginal, setApplyHasOriginal] = useState(0);
  const [applyMsg, setApplyMsg] = useState("");
  const [showApplyForm, setShowApplyForm] = useState(false);

  // Detail
  const [selectedApp, setSelectedApp] = useState<any>(null);

  // Edit profile
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRegion, setEditRegion] = useState("");

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
    if (token) {
      setPage("dashboard");
      loadData();
    }
  }, []);

  useEffect(() => {
    if (page === "dashboard" && token) loadData();
  }, [page, token]);

  const saveToken = (t: string) => {
    setToken(t);
    localStorage.setItem("mpk_token", t);
  };

  const handleLogout = () => {
    setToken("");
    localStorage.removeItem("mpk_token");
    setPage("login");
    setUser(null);
    setMyApps([]);
  };

  const handleLogin = async () => {
    setError("");
    try {
      const res = await API.post("/auth/login", {
        email: loginEmail,
        password: loginPass,
      });
      saveToken(res.data.access_token);
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
      saveToken(res.data.access_token);
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
          score: applyScore ? parseFloat(applyScore) : undefined,
          has_original: applyHasOriginal,
        },
        { headers }
      );
      setApplyMsg("Заявка успешно подана!");
      setShowApplyForm(false);
      setApplyProgram(0);
      setApplyScore("");
      loadData();
    } catch (e: any) {
      setError(e.response?.data?.detail || "Ошибка подачи заявки");
    }
  };

  const handleWithdraw = async (appId: number) => {
    if (!confirm("Вы уверены, что хотите отозвать заявку?")) return;
    try {
      await API.delete(`/cabinet/withdraw/${appId}`, { headers });
      setMyApps(myApps.filter((a) => a.id !== appId));
    } catch (e: any) {
      setError(e.response?.data?.detail || "Ошибка отзыва заявки");
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

  const handleSaveProfile = async () => {
    try {
      const res = await API.put(
        "/cabinet/profile",
        {
          full_name: editName || undefined,
          phone: editPhone || undefined,
          region: editRegion || undefined,
        },
        { headers }
      );
      setUser(res.data);
      setEditingProfile(false);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Ошибка сохранения");
    }
  };

  const programName = (id: number) =>
    programs.find((p: any) => p.id === id)?.name || `#${id}`;

  // ---- AUTH PAGES ----
  if (page === "login" || page === "register") {
    return (
      <div className="cab-auth-wrapper">
        <div className="cab-auth-header">
          <span className="cab-auth-logo">🎓 Личный кабинет абитуриента</span>
          <button className="cab-btn-ghost" onClick={onBack}>
            ← Дашборд комиссии
          </button>
        </div>
        <div className="cab-auth-divider" />
        <div className="cab-auth-card">
          <h2>{page === "login" ? "Вход" : "Регистрация"}</h2>
          {error && <div className="cab-error">{error}</div>}

          {page === "register" && (
            <>
              <input
                placeholder="ФИО"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
              />
              <input
                type="email"
                placeholder="Email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
              <input
                placeholder="Телефон (+7XXXXXXXXXX)"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
              />
              <input
                placeholder="Регион"
                value={regRegion}
                onChange={(e) => setRegRegion(e.target.value)}
              />
              <input
                type="password"
                placeholder="Пароль (мин. 6 символов)"
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
              />
              <button className="cab-btn-primary" onClick={handleRegister}>
                Зарегистрироваться
              </button>
              <p className="cab-switch" onClick={() => { setPage("login"); setError(""); }}>
                Уже есть аккаунт? Войти
              </p>
            </>
          )}

          {page === "login" && (
            <>
              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Пароль"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
              />
              <button className="cab-btn-primary" onClick={handleLogin}>
                Войти
              </button>
              <p className="cab-switch" onClick={() => { setPage("register"); setError(""); }}>
                Нет аккаунта? Регистрация
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---- DASHBOARD / CABINET ----
  return (
    <div className="cab-wrapper">
      {/* Header */}
      <div className="cab-header">
        <div className="cab-header-left">
          <div className="cab-avatar">{user?.full_name?.[0] || "?"}</div>
          <div>
            <div className="cab-greeting">Привет, {user?.full_name?.split(" ")[0] || ""}!</div>
            <div className="cab-email">{user?.email}</div>
          </div>
        </div>
        <div className="cab-header-right">
          <button className="cab-btn-accent" onClick={() => setShowApplyForm(true)}>
            + Подать заявку
          </button>
          <button className="cab-btn-outline" onClick={handleLogout}>
            Выйти
          </button>
          <button className="cab-btn-ghost" onClick={onBack}>
            ← Дашборд
          </button>
        </div>
      </div>

      <div className="cab-content">
        {error && <div className="cab-error">{error}</div>}
        {applyMsg && <div className="cab-success">{applyMsg}</div>}

        {/* Profile */}
        <section className="cab-section">
          <h3 className="cab-section-title">📋 Мой профиль</h3>
          <div className="cab-profile-card">
            {!editingProfile ? (
              <>
                <div className="cab-profile-grid">
                  <div>
                    <span className="cab-label">ФИО:</span> {user?.full_name}
                  </div>
                  <div>
                    <span className="cab-label">Телефон:</span> {user?.phone || "—"}
                  </div>
                  <div>
                    <span className="cab-label">Регион:</span> {user?.region || "—"}
                  </div>
                </div>
                <button
                  className="cab-btn-outline"
                  onClick={() => {
                    setEditName(user?.full_name || "");
                    setEditPhone(user?.phone || "");
                    setEditRegion(user?.region || "");
                    setEditingProfile(true);
                  }}
                >
                  → Редактировать
                </button>
              </>
            ) : (
              <div className="cab-edit-form">
                <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="ФИО" />
                <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Телефон" />
                <input value={editRegion} onChange={(e) => setEditRegion(e.target.value)} placeholder="Регион" />
                <div className="cab-edit-buttons">
                  <button className="cab-btn-accent" onClick={handleSaveProfile}>Сохранить</button>
                  <button className="cab-btn-outline" onClick={() => setEditingProfile(false)}>Отмена</button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* My Applications */}
        <section className="cab-section">
          <h3 className="cab-section-title">📄 Мои заявки ({myApps.length})</h3>
          <div className="cab-apps-grid">
            {myApps.length === 0 ? (
              <div className="cab-empty">У вас пока нет заявок</div>
            ) : (
              myApps.map((a) => (
                <div className="cab-app-card" key={a.id}>
                  <div className="cab-app-top">
                    <span className="cab-app-program">{programName(a.program_id)}</span>
                    <span
                      className="cab-status-badge"
                      style={{ background: STATUS_COLORS[a.status] + "22", color: STATUS_COLORS[a.status] }}
                    >
                      {STATUS_LABELS[a.status] || a.status}
                    </span>
                  </div>

                  {/* Status timeline dots */}
                  <div className="cab-timeline-dots">
                    {["new", "review", "enrolled", "rejected"].map((s) => (
                      <div key={s} className="cab-dot-group">
                        <div
                          className="cab-dot"
                          style={{
                            background:
                              a.status === s || (s === "new" && true)
                                ? STATUS_COLORS[s]
                                : s === "review" && ["review", "enrolled"].includes(a.status)
                                ? STATUS_COLORS[s]
                                : s === "enrolled" && a.status === "enrolled"
                                ? STATUS_COLORS[s]
                                : s === "rejected" && a.status === "rejected"
                                ? STATUS_COLORS[s]
                                : "#333",
                          }}
                        />
                        <span className="cab-dot-label">
                          {s === "new" ? "Новая" : s === "review" ? "Рассмотрение" : s === "enrolled" ? "Зачисление" : "Отказ"}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="cab-app-meta">
                    <div>
                      <strong>Баллы ЕГЭ:</strong> {a.score ?? "—"}
                    </div>
                    <div>
                      <strong>Волна:</strong> {a.wave}
                    </div>
                    <div>
                      <strong>Дата:</strong> {a.created_at ? new Date(a.created_at).toLocaleDateString("ru-RU") : "—"}
                    </div>
                  </div>

                  <div className="cab-app-actions">
                    <button className="cab-btn-small" onClick={() => loadAppDetail(a.id)}>
                      Подробнее
                    </button>
                    {a.status === "new" && (
                      <button className="cab-btn-small cab-btn-danger" onClick={() => handleWithdraw(a.id)}>
                        Отозвать
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Detail modal */}
        {selectedApp && (
          <div className="cab-modal-overlay" onClick={() => setSelectedApp(null)}>
            <div className="cab-modal" onClick={(e) => e.stopPropagation()}>
              <div className="cab-modal-header">
                <h3>Заявка #{selectedApp.id}</h3>
                <button className="cab-btn-ghost" onClick={() => setSelectedApp(null)}>✕</button>
              </div>
              <div className="cab-modal-body">
                <p><strong>Программа:</strong> {selectedApp.program}</p>
                <p><strong>Институт:</strong> {selectedApp.faculty}</p>
                <p><strong>Статус:</strong> {STATUS_LABELS[selectedApp.status] || selectedApp.status}</p>
                <p><strong>Баллы:</strong> {selectedApp.score}</p>
                <p><strong>Волна:</strong> {selectedApp.wave}</p>
                <p><strong>Источник:</strong> {SOURCE_LABELS[selectedApp.source] || selectedApp.source}</p>
                <h4>История изменений</h4>
                <div className="cab-history">
                  {selectedApp.history?.map((h: any, i: number) => (
                    <div key={i} className="cab-history-item">
                      <div
                        className="cab-history-dot"
                        style={{ background: STATUS_COLORS[h.new_status] || "#666" }}
                      />
                      <div>
                        <strong>{STATUS_LABELS[h.new_status] || h.new_status}</strong>
                        {h.old_status && (
                          <span className="cab-history-from"> ← {STATUS_LABELS[h.old_status] || h.old_status}</span>
                        )}
                        <div className="cab-history-date">
                          {new Date(h.changed_at).toLocaleString("ru-RU")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Apply form modal */}
        {showApplyForm && (
          <div className="cab-modal-overlay" onClick={() => setShowApplyForm(false)}>
            <div className="cab-modal" onClick={(e) => e.stopPropagation()}>
              <div className="cab-modal-header">
                <h3>Подать заявку</h3>
                <button className="cab-btn-ghost" onClick={() => setShowApplyForm(false)}>✕</button>
              </div>
              <div className="cab-modal-body">
                <label>Программа</label>
                <select
                  value={applyProgram}
                  onChange={(e) => setApplyProgram(Number(e.target.value))}
                >
                  <option value={0}>Выберите программу</option>
                  {programs.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.faculty})
                    </option>
                  ))}
                </select>

                <label>Баллы ЕГЭ</label>
                <input
                  type="number"
                  placeholder="Напр: 285"
                  value={applyScore}
                  onChange={(e) => setApplyScore(e.target.value)}
                />

                <label>Волна</label>
                <select value={applyWave} onChange={(e) => setApplyWave(Number(e.target.value))}>
                  <option value={1}>1 волна</option>
                  <option value={2}>2 волна</option>
                </select>

                <label>Источник</label>
                <select value={applySource} onChange={(e) => setApplySource(e.target.value)}>
                  <option value="site">Сайт</option>
                  <option value="olymp">Олимпиада</option>
                  <option value="aggregator">Агрегатор</option>
                  <option value="other">Другое</option>
                </select>

                <label className="cab-checkbox-label">
                  <input
                    type="checkbox"
                    checked={applyHasOriginal === 1}
                    onChange={(e) => setApplyHasOriginal(e.target.checked ? 1 : 0)}
                  />
                  Подаю оригиналы документов
                </label>

                <button
                  className="cab-btn-accent"
                  style={{ width: "100%", marginTop: 16 }}
                  onClick={handleApply}
                  disabled={!applyProgram}
                >
                  Отправить заявку
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
