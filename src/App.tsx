import { useEffect, useMemo, useState } from "react";
import {
  Baby,
  CalendarDays,
  Check,
  ChevronLeft,
  Cloud,
  List,
  LogOut,
  Pencil,
  Plus,
  Trash2
} from "lucide-react";
import type { Child, Entry, Project } from "./domain/types";
import { createEntryDraft, formatDays, summarizeProject } from "./domain/calculations";
import { createDemoStore, createSupabaseStore, type LedgerData, type LedgerStore } from "./data/store";
import { isSupabaseConfigured, supabase } from "./data/supabaseClient";
import { currentYearCycle, daysInMonth, monthKey, todayISO } from "./lib/date";

const demoUserId = "demo-user";

type Screen = "home" | "detail";
type Modal = "entry" | "project" | "children" | null;
type ViewMode = "list" | "calendar";

const makeProject = (userId: string): Project => ({
  id: crypto.randomUUID(),
  userId,
  name: "新项目",
  type: "custom",
  quotaDays: 10,
  unitMode: "half_or_full_day",
  ...currentYearCycle()
});

const makeEntry = (project: Project, data: Omit<Entry, "id" | "createdAt">): Entry => ({
  ...data,
  id: crypto.randomUUID(),
  projectId: project.id,
  createdAt: new Date().toISOString()
});

function AuthGate({ onReady }: { onReady: (userId: string, store: LedgerStore) => void }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      onReady(demoUserId, createDemoStore());
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) onReady(data.user.id, createSupabaseStore());
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) onReady(session.user.id, createSupabaseStore());
    });

    return () => listener.subscription.unsubscribe();
  }, [onReady]);

  if (!isSupabaseConfigured) {
    return null;
  }

  const signIn = async () => {
    if (!supabase || !email) return;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    setMessage(error ? error.message : "登录链接已发送，请打开邮箱完成验证。");
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-mark">天</div>
        <p className="eyebrow">Cloud ledger</p>
        <h1>我的天数账本</h1>
        <p className="muted">用邮箱验证码登录，同一账号可在手机和 Mac 自动同步。</p>
        <label>
          邮箱
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        </label>
        <button className="primary" onClick={signIn}>发送验证码链接</button>
        {message && <p className="notice">{message}</p>}
      </section>
    </main>
  );
}

function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [store, setStore] = useState<LedgerStore | null>(null);
  const [data, setData] = useState<LedgerData | null>(null);
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [error, setError] = useState("");

  const ready = (nextUserId: string, nextStore: LedgerStore) => {
    setUserId(nextUserId);
    setStore(nextStore);
  };

  const reload = async () => {
    if (!userId || !store) return;
    setError("");
    setData(await store.load(userId));
  };

  useEffect(() => {
    reload().catch((err: Error) => setError(err.message));
  }, [userId, store]);

  const selectedProject = data?.projects.find((project) => project.id === selectedProjectId) ?? data?.projects[0];
  const summaries = useMemo(
    () => data?.projects.map((project) => summarizeProject(project, data.entries)) ?? [],
    [data]
  );

  if (!userId || !store) return <AuthGate onReady={ready} />;
  if (!data) {
    return (
      <main className="loading">
        {error ? (
          <section className="auth-card">
            <p className="eyebrow">初始化失败</p>
            <h1>账本暂时没打开</h1>
            <p className="error">{error}</p>
            <button className="primary" onClick={reload}>重试</button>
          </section>
        ) : (
          "正在准备你的账本..."
        )}
      </main>
    );
  }

  const saveProject = async (project: Project) => {
    await store.saveProject(project);
    await reload();
  };

  const saveEntry = async (entry: Entry) => {
    await store.saveEntry(entry);
    await reload();
  };

  const deleteEntry = async (entryId: string) => {
    await store.deleteEntry(entryId);
    await reload();
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setUserId(null);
    setData(null);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Day balance</p>
          <h1>我的天数账本</h1>
        </div>
        <div className="top-actions">
          {store.mode === "supabase" && <span className="sync-pill"><Cloud size={15} />云同步</span>}
          <button className="ghost icon-text" onClick={signOut}><LogOut size={16} />退出</button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      {screen === "home" && (
        <>
          <section className="hero-panel">
            <div>
              <p className="eyebrow">今天 {todayISO()}</p>
              <h2>假期余额和包天天数，一眼看清。</h2>
            </div>
            <button className="primary" onClick={() => setModal("entry")}><Plus size={18} />新增记录</button>
          </section>

          <section className="cards-grid">
            {summaries.map((summary) => (
              <button
                className="project-card"
                key={summary.project.id}
                onClick={() => {
                  setSelectedProjectId(summary.project.id);
                  setScreen("detail");
                }}
              >
                <div className="card-topline">
                  <span>{summary.project.type === "kindergarten" ? <Baby size={18} /> : <CalendarDays size={18} />}</span>
                  <span>{summary.project.unitMode === "whole_child_day" ? "整天人次" : "0.5 / 1 天"}</span>
                </div>
                <h3>{summary.project.name}</h3>
                <div className="big-number">{formatDays(summary.remainingDays)}</div>
                <p>{summary.project.unitMode === "whole_child_day" ? "还可用 / 包天总数" : "剩余 / 总额度"} {formatDays(summary.project.quotaDays)} 天</p>
                <div className="meter"><span style={{ width: `${Math.min(100, (summary.usedDays / summary.project.quotaDays) * 100)}%` }} /></div>
                <p>{summary.project.unitMode === "whole_child_day" ? "已去" : "已用"} {formatDays(summary.usedDays)} 天，周期 {summary.project.cycleStart} 至 {summary.project.cycleEnd}</p>
                <RecentEntries
                  project={summary.project}
                  entries={summary.entriesInCycle}
                  children={data.children}
                />
              </button>
            ))}
            <button className="project-card add-card" onClick={() => setModal("project")}>
              <Plus size={24} />
              <h3>新增项目</h3>
              <p>给以后要统计的额度留好入口。</p>
            </button>
          </section>
        </>
      )}

      {screen === "detail" && selectedProject && (
        <ProjectDetail
          project={selectedProject}
          entries={data.entries.filter((entry) => entry.projectId === selectedProject.id)}
          children={data.children}
          viewMode={viewMode}
          onBack={() => setScreen("home")}
          onViewMode={setViewMode}
          onAddEntry={() => setModal("entry")}
          onEditProject={(project) => {
            setEditingProject(project);
            setModal("project");
          }}
          onEditEntry={(entry) => {
            setEditingEntry(entry);
            setModal("entry");
          }}
          onDeleteEntry={deleteEntry}
        />
      )}

      <footer className="bottom-bar">
        <button onClick={() => setModal("children")}>孩子设置</button>
        <button onClick={() => setModal("project")}>新增项目</button>
        <button onClick={() => setModal("entry")}>快速记录</button>
      </footer>

      {modal === "entry" && (
        <EntryModal
          projects={data.projects}
          children={data.children}
          initialProjectId={selectedProject?.id}
          editingEntry={editingEntry}
          onClose={() => {
            setEditingEntry(null);
            setModal(null);
          }}
          onSave={async (entry) => {
            await saveEntry(entry);
            setEditingEntry(null);
            setModal(null);
          }}
        />
      )}
      {modal === "project" && (
        <ProjectModal
          userId={userId}
          editingProject={editingProject}
          onClose={() => {
            setEditingProject(null);
            setModal(null);
          }}
          onSave={async (project) => {
            await saveProject(project);
            setEditingProject(null);
            setModal(null);
          }}
        />
      )}
      {modal === "children" && (
        <ChildrenModal
          userId={userId}
          children={data.children}
          onClose={() => setModal(null)}
          onSave={async (child) => {
            await store.saveChild(child);
            await reload();
          }}
        />
      )}
    </main>
  );
}

function RecentEntries({
  project,
  entries,
  children
}: {
  project: Project;
  entries: Entry[];
  children: Child[];
}) {
  const childName = (id: string) => children.find((child) => child.id === id)?.name ?? "孩子";
  const recentEntries = [...entries]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 3);

  return (
    <div className="recent-entries">
      <span className="recent-title">具体日期</span>
      {recentEntries.length === 0 ? (
        <span className="recent-empty">暂无使用记录</span>
      ) : (
        recentEntries.map((entry) => (
          <span className="recent-chip" key={entry.id}>
            {entry.date}
            <strong>
              {project.unitMode === "whole_child_day"
                ? `${formatDays(entry.amountDays)} 天${entry.childIds.length ? ` · ${entry.childIds.map(childName).join("、")}` : ""}`
                : `${formatDays(entry.amountDays)} 天`}
            </strong>
          </span>
        ))
      )}
    </div>
  );
}

function EntryModal({
  projects,
  children,
  initialProjectId,
  editingEntry,
  onClose,
  onSave
}: {
  projects: Project[];
  children: Child[];
  initialProjectId?: string;
  editingEntry?: Entry | null;
  onClose: () => void;
  onSave: (entry: Entry) => Promise<void>;
}) {
  const [projectId, setProjectId] = useState(editingEntry?.projectId ?? initialProjectId ?? projects[0]?.id);
  const [date, setDate] = useState(editingEntry?.date ?? todayISO());
  const [amount, setAmount] = useState<0.5 | 1>(editingEntry?.amountDays === 0.5 ? 0.5 : 1);
  const [childIds, setChildIds] = useState<string[]>(editingEntry?.childIds ?? []);
  const [note, setNote] = useState(editingEntry?.note ?? "");
  const [error, setError] = useState("");
  const project = projects.find((item) => item.id === projectId) ?? projects[0];

  const submit = async () => {
    try {
      const draft = createEntryDraft(project, {
        date,
        amountDays: project.unitMode === "half_or_full_day" ? amount : undefined,
        childIds,
        note
      });
      await onSave(
        editingEntry
          ? { ...editingEntry, ...draft }
          : makeEntry(project, draft)
      );
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="modal-backdrop">
      <section className="modal">
        <h2>{editingEntry ? "编辑记录" : "新增记录"}</h2>
        <label>项目<select value={projectId} onChange={(event) => setProjectId(event.target.value)}>{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>日期<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        {project.unitMode === "half_or_full_day" ? (
          <div>
            <span className="field-title">天数</span>
            <div className="segmented">
              <button className={amount === 0.5 ? "active" : ""} onClick={() => setAmount(0.5)}>0.5 天</button>
              <button className={amount === 1 ? "active" : ""} onClick={() => setAmount(1)}>1 天</button>
            </div>
          </div>
        ) : (
          <div>
            <span className="field-title">出勤孩子</span>
            <div className="child-picks">
              {children.map((child) => (
                <button
                  key={child.id}
                  className={childIds.includes(child.id) ? "active" : ""}
                  onClick={() =>
                    setChildIds((current) =>
                      current.includes(child.id) ? current.filter((id) => id !== child.id) : [...current, child.id]
                    )
                  }
                >
                  {childIds.includes(child.id) && <Check size={15} />}{child.name}
                </button>
              ))}
            </div>
            <p className="muted">已选择 {childIds.length} 个孩子，将计 {childIds.length} 天。</p>
          </div>
        )}
        <label>备注<input value={note} onChange={(event) => setNote(event.target.value)} placeholder="例如：下午请假 / 两个孩子都去" /></label>
        {error && <p className="error">{error}</p>}
        <div className="modal-actions"><button className="ghost" onClick={onClose}>取消</button><button className="primary" onClick={submit}>保存</button></div>
      </section>
    </div>
  );
}

function ProjectModal({
  userId,
  editingProject,
  onClose,
  onSave
}: {
  userId: string;
  editingProject?: Project | null;
  onClose: () => void;
  onSave: (project: Project) => Promise<void>;
}) {
  const [project, setProject] = useState<Project>(editingProject ?? makeProject(userId));

  return (
    <div className="modal-backdrop">
      <section className="modal">
        <h2>{editingProject ? "项目设置" : "新增项目"}</h2>
        <label>名称<input value={project.name} onChange={(event) => setProject({ ...project, name: event.target.value })} /></label>
        <label>总额度<input type="number" min="0" step="0.5" value={project.quotaDays} onChange={(event) => setProject({ ...project, quotaDays: Number(event.target.value) })} /></label>
        <label>开始日期<input type="date" value={project.cycleStart} onChange={(event) => setProject({ ...project, cycleStart: event.target.value })} /></label>
        <label>结束日期<input type="date" value={project.cycleEnd} onChange={(event) => setProject({ ...project, cycleEnd: event.target.value })} /></label>
        <label>计算方式<select value={project.unitMode} onChange={(event) => setProject({ ...project, unitMode: event.target.value as Project["unitMode"], type: event.target.value === "whole_child_day" ? "kindergarten" : "custom" })}><option value="half_or_full_day">请假：0.5 / 1 天</option><option value="whole_child_day">幼儿园：整天孩子人次</option></select></label>
        <div className="modal-actions"><button className="ghost" onClick={onClose}>取消</button><button className="primary" onClick={() => onSave(project)}>保存</button></div>
      </section>
    </div>
  );
}

function ChildrenModal({ userId, children, onClose, onSave }: { userId: string; children: Child[]; onClose: () => void; onSave: (child: Child) => Promise<void> }) {
  const [name, setName] = useState("");

  return (
    <div className="modal-backdrop">
      <section className="modal">
        <h2>孩子设置</h2>
        <div className="plain-list">{children.map((child) => <p key={child.id}>{child.name}</p>)}</div>
        <label>新增孩子<input value={name} onChange={(event) => setName(event.target.value)} placeholder="孩子名字" /></label>
        <div className="modal-actions"><button className="ghost" onClick={onClose}>关闭</button><button className="primary" onClick={async () => { if (!name.trim()) return; await onSave({ id: crypto.randomUUID(), userId, name: name.trim() }); setName(""); }}>添加</button></div>
      </section>
    </div>
  );
}

function ProjectDetail({
  project,
  entries,
  children,
  viewMode,
  onBack,
  onViewMode,
  onAddEntry,
  onEditProject,
  onEditEntry,
  onDeleteEntry
}: {
  project: Project;
  entries: Entry[];
  children: Child[];
  viewMode: ViewMode;
  onBack: () => void;
  onViewMode: (mode: ViewMode) => void;
  onAddEntry: () => void;
  onEditProject: (project: Project) => void;
  onEditEntry: (entry: Entry) => void;
  onDeleteEntry: (entryId: string) => Promise<void>;
}) {
  const summary = summarizeProject(project, entries);
  const activeMonth = monthKey(entries[0]?.date ?? todayISO());
  const childName = (id: string) => children.find((child) => child.id === id)?.name ?? "孩子";
  const isKindergarten = project.unitMode === "whole_child_day";

  return (
    <section className="detail">
      <button className="ghost icon-text" onClick={onBack}><ChevronLeft size={18} />返回</button>
      <div className="detail-head">
        <div>
          <p className="eyebrow">{project.cycleStart} 至 {project.cycleEnd}</p>
          <h2>{project.name}</h2>
          <p>
            {isKindergarten
              ? `已去 ${formatDays(summary.usedDays)} 天，还可用 ${formatDays(summary.remainingDays)} 天，包天总数 ${formatDays(project.quotaDays)} 天。`
              : `已用 ${formatDays(summary.usedDays)} 天，剩余 ${formatDays(summary.remainingDays)} 天。`}
          </p>
        </div>
        <div className="detail-actions">
          <button className="ghost icon-text" onClick={() => onEditProject(project)}><Pencil size={16} />编辑项目</button>
          <button className="primary" onClick={onAddEntry}><Plus size={18} />新增记录</button>
        </div>
      </div>
      <div className="segmented compact">
        <button className={viewMode === "list" ? "active" : ""} onClick={() => onViewMode("list")}><List size={15} />列表</button>
        <button className={viewMode === "calendar" ? "active" : ""} onClick={() => onViewMode("calendar")}><CalendarDays size={15} />日历</button>
      </div>
      {viewMode === "list" ? (
        <div className="entry-list">
          {summary.entriesInCycle.length === 0 && <p className="empty">当前周期还没有记录。</p>}
          {summary.entriesInCycle.map((entry) => (
            <article className="entry-row" key={entry.id}>
              <div><strong>{entry.date}</strong><p>{project.unitMode === "whole_child_day" ? entry.childIds.map(childName).join("、") : `${formatDays(entry.amountDays)} 天`} {entry.note}</p></div>
              <div className="row-actions">
                <button className="ghost" onClick={() => onEditEntry(entry)}><Pencil size={16} /></button>
                <button className="danger" onClick={() => onDeleteEntry(entry.id)}><Trash2 size={16} /></button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <CalendarView month={activeMonth} entries={summary.entriesInCycle} />
      )}
    </section>
  );
}

function CalendarView({ month, entries }: { month: string; entries: Entry[] }) {
  const countByDate = new Map<string, number>();
  entries.forEach((entry) => countByDate.set(entry.date, (countByDate.get(entry.date) ?? 0) + entry.amountDays));

  return (
    <div className="calendar-grid">
      {Array.from({ length: daysInMonth(month) }, (_, index) => {
        const day = `${month}-${String(index + 1).padStart(2, "0")}`;
        const count = countByDate.get(day);
        return <div className={count ? "calendar-day has-entry" : "calendar-day"} key={day}><span>{index + 1}</span>{count ? <strong>{formatDays(count)} 天</strong> : null}</div>;
      })}
    </div>
  );
}

export default App;
