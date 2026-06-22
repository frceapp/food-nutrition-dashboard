import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Apple,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleUserRound,
  Clock3,
  Coins,
  Flame,
  Gauge,
  ImageIcon,
  LayoutDashboard,
  ListChecks,
  LoaderCircle,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Wheat,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  dataService,
  logoutAdmin,
  observeAdminAuth,
  signInAdmin,
} from "./firebase";
import type { User as FirebaseUser } from "firebase/auth";
import type {
  DashboardData,
  Period,
  ProfileUpdate,
  RuntimeSettings,
  UsageAnalytics,
  UserOption,
  Viewer,
  WhitelistEntry,
} from "./types";

type View = "overview" | "usage" | "whitelist" | "settings";

const nutrientMeta = [
  { key: "carbohydrate_g", label: "Karbohidrat", unit: "g", color: "#e9a23b", icon: Wheat },
  { key: "protein_g", label: "Protein", unit: "g", color: "#d86e5d", icon: Activity },
  { key: "fat_g", label: "Lemak", unit: "g", color: "#7e8f58", icon: Apple },
  { key: "fiber_g", label: "Serat", unit: "g", color: "#4d9a75", icon: Sparkles },
] as const;

function fmt(value: number | undefined, digits = 0): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: digits }).format(value || 0);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function LoginPage() {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) return;
    window.history.replaceState({}, "", "/login");
    setState("loading");
    signInAdmin(code)
      .then(() => {
        window.history.replaceState({}, "", "/");
        window.location.assign("/");
      })
      .catch((error: Error) => {
        setMessage(error.message);
        setState("error");
      });
  }, []);

  return (
    <main className="login-page">
      <div className="login-orb login-orb-one" />
      <div className="login-orb login-orb-two" />
      <section className="login-card">
        <div className="brand-mark"><Apple size={30} /></div>
        <p className="eyebrow">NUTRIA DASHBOARD</p>
        <h1>Pahami pola makan.<br />Ambil keputusan lebih baik.</h1>
        <p className="login-copy">
          Dashboard pribadi untuk memantau asupan nutrisi dan progres harian.
        </p>
        <div className={`login-status ${state}`}>
          {state === "loading" ? (
            <><LoaderCircle className="spin" size={20} /> Memverifikasi tautan aman…</>
          ) : state === "error" ? (
            <><span>!</span> {message || "Tautan tidak valid atau kedaluwarsa."}</>
          ) : (
            <><ShieldCheck size={20} /> Buka tautan masuk yang diterima melalui WhatsApp.</>
          )}
        </div>
        <p className="login-footnote">Gunakan tautan segera dan jangan membagikannya kepada orang lain.</p>
      </section>
    </main>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Apple size={28} /></div>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function ProfileEditor({ data, onSave }: { data: DashboardData; onSave: (payload: ProfileUpdate) => Promise<void> }) {
  const [name, setName] = useState("");
  const [weight, setWeight] = useState(60);
  const [height, setHeight] = useState(160);
  const [activity, setActivity] = useState<ProfileUpdate["activity_level"]>("ringan");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setName(data.profile?.name || "");
    setWeight(data.profile?.weight_kg || 60);
    setHeight(data.profile?.height_cm || 160);
    setActivity((data.profile?.activity_level as ProfileUpdate["activity_level"]) || "ringan");
    setMessage("");
  }, [data.phone_number, data.profile]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true); setMessage("");
    try {
      await onSave({ name, weight_kg: weight, height_cm: height, activity_level: activity });
      setMessage("Profil, IMT, dan target kalori sudah diperbarui.");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel profile-editor-panel">
      <div className="panel-head"><div><p className="eyebrow">PROFIL & IMT</p><h3>Perbarui data pengguna</h3></div><CircleUserRound size={21} /></div>
      <form className="profile-edit-grid" onSubmit={submit}>
        <label><span>Nama</span><input value={name} maxLength={80} required onChange={(event) => setName(event.target.value)} /></label>
        <label><span>Berat badan (kg)</span><input type="number" min="25" max="300" step="0.1" value={weight} required onChange={(event) => setWeight(Number(event.target.value))} /></label>
        <label><span>Tinggi badan (cm)</span><input type="number" min="100" max="230" step="0.1" value={height} required onChange={(event) => setHeight(Number(event.target.value))} /></label>
        <label><span>Aktivitas</span><select value={activity} onChange={(event) => setActivity(event.target.value as ProfileUpdate["activity_level"])}><option value="rendah">Rendah</option><option value="ringan">Ringan</option><option value="sedang">Sedang</option><option value="tinggi">Tinggi</option></select></label>
        <div className="profile-edit-action"><span>{message}</span><button className="primary-button" disabled={saving} type="submit">{saving ? <LoaderCircle className="spin" size={18} /> : <CheckCircle2 size={18} />} Simpan profil</button></div>
      </form>
    </section>
  );
}

function Overview({ data, loading, canDelete = false, onDeleteMeal, onSaveProfile }: { data: DashboardData | null; loading: boolean; canDelete?: boolean; onDeleteMeal?: (id: string) => void; onSaveProfile: (payload: ProfileUpdate) => Promise<void> }) {
  if (loading) return <div className="page-loader"><LoaderCircle className="spin" /> Memuat data nutrisi…</div>;
  if (!data) return <EmptyState title="Pilih pengguna" body="Pilih nomor WhatsApp untuk melihat data nutrisi." />;

  const calories = data.totals.energy_kcal || 0;
  const calorieTarget = data.targets.energy_kcal || 0;
  const caloriePercent = data.progress.energy_kcal?.percent || 0;
  const macroChart = nutrientMeta.slice(0, 3).map((item) => ({
    name: item.label,
    aktual: data.totals[item.key] || 0,
    target: data.targets[item.key] || 0,
    fill: item.color,
  }));
  const evaluationItems = ([
    { key: "energy_kcal", label: "Energi" },
    { key: "protein_g", label: "Protein" },
    { key: "fiber_g", label: "Serat" },
  ] as const).map(({ key, label }) => {
    const item = data.progress[key];
    const percent = item?.percent || 0;
    const tone = !data.targets[key] ? "neutral" : percent < 80 ? "low" : percent <= 120 ? "good" : "high";
    const text = !data.targets[key]
      ? "Target belum tersedia. Lengkapi profil pengguna terlebih dahulu."
      : percent < 80
        ? `Baru ${fmt(percent)}% dari target periode ini.`
        : percent <= 120
          ? `${fmt(percent)}% dan masih berada pada rentang target.`
          : `${fmt(percent)}% atau sudah melewati rentang target.`;
    return { label, tone, text };
  });

  return (
    <div className="overview-stack">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">RINGKASAN NUTRISI</p>
          <h2>{data.profile?.name ? `Halo, ${data.profile.name}` : "Data pengguna"}</h2>
          <p>{data.period === "daily" ? "Asupan yang tercatat hari ini" : "Akumulasi tujuh hari terakhir"}</p>
        </div>
        {data.profile && (
          <div className="profile-pill">
            <CircleUserRound size={18} />
            <span>IMT <strong>{data.profile.bmi || "—"}</strong> · {data.profile.bmi_category || "belum tersedia"}</span>
          </div>
        )}
      </section>

      <ProfileEditor data={data} onSave={onSaveProfile} />

      <section className="stats-grid">
        <article className="stat-card calorie-card">
          <div className="stat-icon"><Flame size={22} /></div>
          <div className="stat-main">
            <span>Energi</span>
            <strong>{fmt(calories)} <small>kkal</small></strong>
            <p>dari target {fmt(calorieTarget)} kkal</p>
          </div>
          <div className="radial" style={{ "--progress": `${Math.min(caloriePercent, 100) * 3.6}deg` } as React.CSSProperties}>
            <span>{fmt(caloriePercent)}%</span>
          </div>
        </article>
        {nutrientMeta.map((item) => {
          const Icon = item.icon;
          const progress = data.progress[item.key];
          return (
            <article className="stat-card" key={item.key}>
              <div className="stat-icon soft" style={{ color: item.color, background: `${item.color}18` }}><Icon size={20} /></div>
              <div className="stat-main">
                <span>{item.label}</span>
                <strong>{fmt(data.totals[item.key], 1)} <small>{item.unit}</small></strong>
                <div className="mini-progress"><i style={{ width: `${Math.min(progress?.percent || 0, 100)}%`, background: item.color }} /></div>
                <p>{progress?.status || "target belum tersedia"}</p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="charts-grid">
        <article className="panel chart-panel">
          <div className="panel-head">
            <div><p className="eyebrow">TREN ENERGI</p><h3>Kalori tercatat</h3></div>
            <span className="chart-unit">kkal</span>
          </div>
          {data.daily_series.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.daily_series} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e8ebe6" />
                <XAxis dataKey="date" tickFormatter={formatDate} axisLine={false} tickLine={false} tick={{ fill: "#768078", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#768078", fontSize: 12 }} />
                <Tooltip labelFormatter={(label) => formatDate(String(label))} />
                <Line type="monotone" dataKey="energy_kcal" name="Energi" stroke="#2f7d62" strokeWidth={3} dot={{ fill: "#fff", stroke: "#2f7d62", strokeWidth: 3, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyState title="Belum ada grafik" body="Grafik muncul setelah makanan pertama tercatat." />}
        </article>

        <article className="panel chart-panel">
          <div className="panel-head">
            <div><p className="eyebrow">MAKRONUTRIEN</p><h3>Aktual vs target</h3></div>
            <span className="chart-unit">gram</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={macroChart} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e8ebe6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#768078", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#768078", fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="target" name="Target" fill="#e5e9e3" radius={[6, 6, 0, 0]} />
              <Bar dataKey="aktual" name="Aktual" fill="#dd8c4c" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>
      </section>

      <section className="panel evaluation-panel">
        <div className="panel-head">
          <div><p className="eyebrow">EVALUASI OTOMATIS</p><h3>Ringkasan terhadap target</h3></div>
          <BarChart3 size={20} />
        </div>
        {data.meals.length ? (
          <div className="evaluation-grid">
            {evaluationItems.map((item) => (
              <article className={`evaluation-item ${item.tone}`} key={item.label}>
                <CheckCircle2 size={18} />
                <div><strong>{item.label}</strong><p>{item.text}</p></div>
              </article>
            ))}
          </div>
        ) : (
          <p className="evaluation-empty">Evaluasi akan tersedia setelah ada makanan yang tercatat pada periode ini.</p>
        )}
        <p className="evaluation-note">Evaluasi berdasarkan estimasi makanan yang dikirim melalui WhatsApp, bukan diagnosis medis.</p>
      </section>

      <section className="panel meals-panel">
        <div className="panel-head">
          <div><p className="eyebrow">CATATAN MAKAN</p><h3>Makanan yang dikonsumsi</h3></div>
          <span className="count-badge">{data.meals.length} analisis</span>
        </div>
        {data.meals.length ? (
          <div className="meal-list">
            {data.meals.map((meal) => (
              <article className="meal-row" key={meal.id}>
                <div className="meal-time"><strong>{formatTime(meal.created_at)}</strong><span>{formatDate(meal.date)}</span>{meal.status === "rejected" && <em>Ditolak pengguna</em>}</div>
                <div className="meal-foods">
                  {meal.foods.map((food, index) => (
                    <span className="food-chip" key={`${food.name}-${index}`}>{food.emoji || "🍽️"} {food.name} <small>{food.estimated_portion}</small></span>
                  ))}
                </div>
                <div className="meal-actions"><div className="meal-calories"><Flame size={16} /> <strong>{fmt(meal.nutrition.energy_kcal)}</strong><span>kkal</span></div>{canDelete && <button className="icon-button danger" onClick={() => onDeleteMeal?.(meal.id)} title="Hapus catatan makanan" aria-label="Hapus catatan makanan"><Trash2 size={16} /></button>}</div>
              </article>
            ))}
          </div>
        ) : <EmptyState title="Belum ada makanan" body="Makanan yang dianalisis melalui WhatsApp akan muncul di sini." />}
      </section>
    </div>
  );
}

function WhitelistPanel() {
  const [entries, setEntries] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ phone_number: "", label: "", is_admin: false });

  const reload = () => {
    setLoading(true);
    dataService.whitelist().then(setEntries).catch((e: Error) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(reload, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return entries.filter((item) => `${item.phone_number} ${item.label || ""}`.toLowerCase().includes(q));
  }, [entries, search]);

  const addEntry = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await dataService.addWhitelist(form);
      setForm({ phone_number: "", label: "", is_admin: false });
      reload();
    } catch (e) { setError((e as Error).message); }
  };

  const toggle = async (entry: WhitelistEntry, field: "is_enabled" | "is_admin") => {
    setError("");
    try {
      await dataService.updateWhitelist(entry.id, { [field]: !entry[field] });
      reload();
    } catch (e) { setError((e as Error).message); }
  };

  const remove = async (entry: WhitelistEntry) => {
    if (!window.confirm(`Nonaktifkan akses ${entry.phone_number}?`)) return;
    try { await dataService.removeWhitelist(entry.id); reload(); } catch (e) { setError((e as Error).message); }
  };

  return (
    <div className="whitelist-page">
      <section className="welcome-row">
        <div><p className="eyebrow">KONTROL AKSES</p><h2>Whitelist WhatsApp</h2><p>Hanya nomor aktif di bawah ini yang dapat menggunakan bot.</p></div>
        <span className="access-count"><ShieldCheck size={18} /> {entries.filter((entry) => entry.is_enabled).length} nomor aktif</span>
      </section>

      <section className="panel add-access-panel">
        <div><p className="eyebrow">TAMBAH AKSES</p><h3>Daftarkan nomor baru</h3></div>
        <form onSubmit={addEntry} className="access-form">
          <label><span>Nomor WhatsApp</span><input required placeholder="628123456789" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} /></label>
          <label><span>Nama / label</span><input placeholder="Nama pengguna" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></label>
          <label className="checkbox-label"><input type="checkbox" checked={form.is_admin} onChange={(e) => setForm({ ...form, is_admin: e.target.checked })} /><span>Jadikan admin</span></label>
          <button className="primary-button" type="submit"><Plus size={18} /> Tambahkan</button>
        </form>
        {error && <p className="form-error">{error}</p>}
      </section>

      <section className="panel access-list-panel">
        <div className="panel-head access-head">
          <div><p className="eyebrow">DAFTAR AKSES</p><h3>Nomor terdaftar</h3></div>
          <div className="search-box"><Search size={17} /><input placeholder="Cari nomor atau nama" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        </div>
        {loading ? <div className="page-loader"><LoaderCircle className="spin" /> Memuat whitelist…</div> : (
          <div className="access-table-wrap">
            <table className="access-table">
              <thead><tr><th>Pengguna</th><th>Peran</th><th>Status</th><th>Ditambahkan</th><th aria-label="Aksi" /></tr></thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.id}>
                    <td className="access-user" data-label="Pengguna"><strong>{entry.label || "Tanpa nama"}</strong><span>{entry.phone_number}</span></td>
                    <td data-label="Peran"><button className={`role-badge ${entry.is_admin ? "admin" : ""}`} onClick={() => toggle(entry, "is_admin")}>{entry.is_admin ? "Admin" : "Pengguna"}</button></td>
                    <td data-label="Status"><button className={`status-toggle ${entry.is_enabled ? "active" : ""}`} onClick={() => toggle(entry, "is_enabled")}><i /> {entry.is_enabled ? "Aktif" : "Nonaktif"}</button></td>
                    <td data-label="Ditambahkan">{formatDate(entry.created_at.slice(0, 10))}</td>
                    <td className="access-actions"><button className="icon-button danger" onClick={() => remove(entry)} title="Nonaktifkan" aria-label={`Nonaktifkan ${entry.phone_number}`}><Trash2 size={17} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function UsagePanel() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<UsageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true); setError("");
    dataService.usageAnalytics(days)
      .then(setData)
      .catch((reason) => { setData(null); setError((reason as Error).message); })
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <div className="page-loader"><LoaderCircle className="spin" /> Memuat statistik penggunaan…</div>;
  if (error) return <EmptyState title="Statistik tidak dapat dimuat" body={`${error}. Pastikan Firestore Rules terbaru sudah dideploy.`} />;
  if (!data) return <EmptyState title="Data belum tersedia" body="Belum ada telemetry penggunaan yang tercatat." />;

  const cards = [
    { label: "Request WhatsApp", value: fmt(data.totals.requests), icon: BarChart3 },
    { label: "Gambar diproses", value: fmt(data.totals.images), icon: ImageIcon },
    { label: "Total revisi", value: fmt(data.totals.revisions), icon: RefreshCw },
    { label: "Token AI", value: fmt(data.totals.total_tokens), icon: Coins },
    { label: "Pengguna aktif", value: fmt(data.totals.active_users), icon: Users },
    { label: "Success rate", value: `${fmt(data.totals.success_rate, 1)}%`, icon: CheckCircle2 },
  ];

  return (
    <div className="usage-page">
      <section className="welcome-row">
        <div><p className="eyebrow">USAGE ANALYTICS</p><h2>Aktivitas bot dan penggunaan AI</h2><p>Request, gambar, revisi, serta konsumsi token OpenRouter.</p></div>
        <div className="period-toggle"><button className={days === 7 ? "active" : ""} onClick={() => setDays(7)}>7 hari</button><button className={days === 30 ? "active" : ""} onClick={() => setDays(30)}>30 hari</button></div>
      </section>
      <section className="usage-stats-grid">
        {cards.map(({ label, value, icon: Icon }) => <article className="stat-card usage-stat" key={label}><div className="stat-icon soft"><Icon size={19} /></div><div className="stat-main"><span>{label}</span><strong>{value}</strong></div></article>)}
      </section>
      <section className="charts-grid usage-charts">
        <article className="panel chart-panel">
          <div className="panel-head"><div><p className="eyebrow">TREN HARIAN</p><h3>Request dan gambar</h3></div></div>
          <ResponsiveContainer width="100%" height={260}><LineChart data={data.daily_series}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tickFormatter={formatDate} /><YAxis allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="requests" name="Request" stroke="#2d7560" strokeWidth={3} /><Line type="monotone" dataKey="images" name="Gambar" stroke="#e59a51" strokeWidth={3} /></LineChart></ResponsiveContainer>
        </article>
        <article className="panel chart-panel">
          <div className="panel-head"><div><p className="eyebrow">TOKEN AI</p><h3>Konsumsi token per hari</h3></div><span className="chart-unit">Total {fmt(data.totals.total_tokens)}</span></div>
          <ResponsiveContainer width="100%" height={260}><BarChart data={data.daily_series}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tickFormatter={formatDate} /><YAxis /><Tooltip /><Bar dataKey="total_tokens" name="Token" fill="#4d8f72" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
        </article>
      </section>
      <section className="panel usage-table-panel">
        <div className="panel-head"><div><p className="eyebrow">PENGGUNA TERATAS</p><h3>Aktivitas per nomor WhatsApp</h3></div><span className="count-badge">Estimasi biaya ${data.totals.cost_usd.toFixed(5)}</span></div>
        <div className="access-table-wrap"><table className="access-table"><thead><tr><th>Nomor</th><th>Request</th><th>Gambar</th><th>Token</th></tr></thead><tbody>{data.top_users.map((user) => <tr key={user.phone_number}><td data-label="Nomor"><strong>{user.phone_number}</strong></td><td data-label="Request">{fmt(user.requests)}</td><td data-label="Gambar">{fmt(user.images)}</td><td data-label="Token">{fmt(user.tokens)}</td></tr>)}</tbody></table></div>
      </section>
    </div>
  );
}

function SettingsPanel() {
  const [settings, setSettings] = useState<RuntimeSettings | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    dataService.runtimeSettings()
      .then(setSettings)
      .catch((reason) => setLoadError((reason as Error).message));
  }, []);
  if (loadError) return <EmptyState title="Pengaturan tidak dapat dimuat" body={`${loadError}. Pastikan Firestore Rules terbaru sudah dideploy.`} />;
  if (!settings) return <div className="page-loader"><LoaderCircle className="spin" /> Memuat pengaturan…</div>;

  const save = async (next = settings) => {
    setSaving(true); setMessage("");
    try { await dataService.saveRuntimeSettings(next); setSettings(next); setMessage("Pengaturan tersimpan."); }
    catch (error) { setMessage((error as Error).message); }
    finally { setSaving(false); }
  };
  const toggleMaintenance = () => save({ ...settings, maintenance_manual: !settings.maintenance_manual });

  return (
    <div className="settings-page">
      <section className="welcome-row"><div><p className="eyebrow">BOT CONTROL</p><h2>Pengaturan operasional</h2><p>Maintenance, batas kirim gambar, dan revisi makanan.</p></div><span className={`maintenance-badge ${settings.maintenance_manual ? "active" : ""}`}>{settings.maintenance_manual ? "Maintenance aktif" : "Bot aktif"}</span></section>
      <section className="panel maintenance-panel">
        <div className="setting-section-head"><div className="setting-icon"><Clock3 /></div><div><h3>Maintenance</h3><p>Mode maintenance memblokir semua request yang akan memakai AI.</p></div><button className={`maintenance-button ${settings.maintenance_manual ? "stop" : ""}`} disabled={saving} onClick={toggleMaintenance}>{settings.maintenance_manual ? "Matikan maintenance" : "Aktifkan sekarang"}</button></div>
        <div className="settings-grid">
          <label className="toggle-field"><input type="checkbox" checked={settings.maintenance_schedule_enabled} onChange={(e) => setSettings({ ...settings, maintenance_schedule_enabled: e.target.checked })} /><span>Jadwal rutin aktif</span></label>
          <label><span>Mulai</span><input type="time" value={settings.maintenance_start} onChange={(e) => setSettings({ ...settings, maintenance_start: e.target.value })} /></label>
          <label><span>Selesai</span><input type="time" value={settings.maintenance_end} onChange={(e) => setSettings({ ...settings, maintenance_end: e.target.value })} /></label>
          <label className="wide-field"><span>Pesan maintenance</span><input value={settings.maintenance_message} onChange={(e) => setSettings({ ...settings, maintenance_message: e.target.value })} /></label>
        </div>
      </section>
      <section className="panel limits-panel">
        <div className="setting-section-head"><div className="setting-icon"><Gauge /></div><div><h3>Limit pengguna</h3><p>Atur jeda, kuota gambar, batas revisi, dan waktu konfirmasi otomatis.</p></div></div>
        <div className="settings-grid limits-grid">
          <label><span>Jeda antar gambar (detik)</span><input type="number" min="0" max="3600" value={settings.image_cooldown_seconds} onChange={(e) => setSettings({ ...settings, image_cooldown_seconds: Number(e.target.value) })} /></label>
          <label><span>Durasi window (menit)</span><input type="number" min="1" max="1440" value={settings.image_window_minutes} onChange={(e) => setSettings({ ...settings, image_window_minutes: Number(e.target.value) })} /></label>
          <label><span>Maksimal gambar / window</span><input type="number" min="1" max="1000" value={settings.max_images_per_window} onChange={(e) => setSettings({ ...settings, max_images_per_window: Number(e.target.value) })} /></label>
          <label><span>Maksimal revisi / analisis</span><input type="number" min="0" max="50" value={settings.max_revisions_per_analysis} onChange={(e) => setSettings({ ...settings, max_revisions_per_analysis: Number(e.target.value) })} /></label>
          <label><span>Konfirmasi otomatis (menit)</span><input type="number" min="1" max="1440" value={settings.confirmation_timeout_minutes} onChange={(e) => setSettings({ ...settings, confirmation_timeout_minutes: Number(e.target.value) })} /></label>
        </div>
      </section>
      <div className="settings-actions"><span>{message}</span><button className="primary-button" disabled={saving} onClick={() => save()}>{saving ? <LoaderCircle className="spin" size={18} /> : <CheckCircle2 size={18} />} Simpan pengaturan</button></div>
    </div>
  );
}

function DashboardApp({ viewer }: { viewer: Viewer }) {
  const [view, setView] = useState<View>("overview");
  const [period, setPeriod] = useState<Period>("daily");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedPhone, setSelectedPhone] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewerLabel, setViewerLabel] = useState(viewer.label || viewer.phone_number);

  useEffect(() => {
    if (!viewer.is_admin) {
      setSelectedPhone(viewer.phone_number);
      return;
    }
    Promise.all([dataService.me(), dataService.users()])
      .then(([admin, userList]) => {
        setViewerLabel(admin.label || admin.phone_number);
        setUsers(userList);
        const preferred = userList.find((user) => !user.is_admin && user.profile_complete) || userList[0];
        if (preferred) setSelectedPhone(preferred.phone_number);
      })
      .catch(() => undefined);
  }, [viewer]);

  useEffect(() => {
    if (!selectedPhone || view !== "overview") return;
    setLoading(true);
    dataService.dashboard(selectedPhone, period, viewer.is_admin).then(setData).finally(() => setLoading(false));
  }, [selectedPhone, period, view, viewer.is_admin]);

  const logout = () => { logoutAdmin().finally(() => window.location.assign("/login")); };
  const deleteMeal = async (logId: string) => {
    if (!viewer.is_admin || !window.confirm("Hapus catatan makanan ini secara permanen?")) return;
    await dataService.deleteMeal(logId);
    if (selectedPhone) {
      setData(await dataService.dashboard(selectedPhone, period, true));
    }
  };
  const saveProfile = async (payload: ProfileUpdate) => {
    if (!selectedPhone) throw new Error("Pilih pengguna terlebih dahulu");
    await dataService.updateProfile(selectedPhone, payload);
    setData(await dataService.dashboard(selectedPhone, period, viewer.is_admin));
    if (selectedPhone === viewer.phone_number) setViewerLabel(payload.name.trim());
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${viewer.is_admin ? "" : "user-sidebar"}`}>
        <div className="sidebar-brand"><div className="brand-mark small"><Apple size={22} /></div><div><strong>NUTRIA</strong><span>Nutrition intelligence</span></div></div>
        <nav>
          <button className={view === "overview" ? "active" : ""} aria-current={view === "overview" ? "page" : undefined} onClick={() => setView("overview")}><LayoutDashboard size={19} /> Ringkasan</button>
          {viewer.is_admin && <button className={view === "usage" ? "active" : ""} aria-current={view === "usage" ? "page" : undefined} onClick={() => setView("usage")}><BarChart3 size={19} /> Penggunaan</button>}
          {viewer.is_admin && <button className={view === "whitelist" ? "active" : ""} aria-current={view === "whitelist" ? "page" : undefined} onClick={() => setView("whitelist")}><ListChecks size={19} /> Akses</button>}
          {viewer.is_admin && <button className={view === "settings" ? "active" : ""} aria-current={view === "settings" ? "page" : undefined} onClick={() => setView("settings")}><Settings2 size={19} /> Pengaturan</button>}
        </nav>
        <div className="sidebar-footer">
          <div className="admin-chip"><div>{viewerLabel.slice(0, 1).toUpperCase()}</div><span><strong>{viewerLabel}</strong><small>{viewer.is_admin ? "Administrator" : "Pengguna"}</small></span></div>
          <button className="logout-button" onClick={logout} title="Keluar"><LogOut size={18} /></button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><Apple size={22} /> NUTRIA</div>
          <button className="mobile-logout" onClick={logout} title="Keluar" aria-label="Keluar dari dashboard"><LogOut size={18} /><span>Keluar</span></button>
          {view === "overview" ? (
            <div className="topbar-controls">
              {viewer.is_admin ? <label className="user-select"><Users size={17} /><select aria-label="Pilih pengguna" value={selectedPhone} onChange={(e) => setSelectedPhone(e.target.value)}><option value="">Pilih pengguna</option>{users.map((user) => <option key={user.phone_number} value={user.phone_number}>{user.label || user.phone_number}</option>)}</select><ChevronDown size={15} /></label> : <div className="profile-pill"><CircleUserRound size={17} /><strong>{viewerLabel}</strong></div>}
              <div className="period-toggle"><button className={period === "daily" ? "active" : ""} onClick={() => setPeriod("daily")}>Hari ini</button><button className={period === "weekly" ? "active" : ""} onClick={() => setPeriod("weekly")}>7 hari</button></div>
              <button className="icon-button refresh-button" onClick={() => selectedPhone && dataService.dashboard(selectedPhone, period, viewer.is_admin).then(setData)} title="Muat ulang" aria-label="Muat ulang data"><RefreshCw size={18} /></button>
            </div>
          ) : <div className="topbar-title"><ShieldCheck size={18} /> Admin dashboard</div>}
        </header>
        <div className="content-area">
          {view === "overview" && <Overview data={data} loading={loading} canDelete={viewer.is_admin} onDeleteMeal={deleteMeal} onSaveProfile={saveProfile} />}
          {view === "usage" && <UsagePanel />}
          {view === "whitelist" && <WhitelistPanel />}
          {view === "settings" && <SettingsPanel />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => observeAdminAuth((nextUser) => {
    setUser(nextUser);
    if (!nextUser) {
      setViewer(null);
      setAuthReady(true);
      return;
    }
    setAuthReady(false);
    dataService.viewer()
      .then(setViewer)
      .finally(() => setAuthReady(true));
  }), []);

  if (window.location.pathname === "/login") return <LoginPage />;
  if (!authReady) return <div className="page-loader"><LoaderCircle className="spin" /> Memuat sesi dashboard...</div>;
  if (!user || !viewer) return <LoginPage />;
  return <DashboardApp viewer={viewer} />;
}
