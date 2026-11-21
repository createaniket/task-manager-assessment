import { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";

const STATUSES = [
  { value: "todo", label: "To do" },
  { value: "in-progress", label: "In progress" },
  { value: "done", label: "Done" },
];
const PRIORITIES = ["low", "medium", "high"];

const emptyForm = { title: "", description: "", priority: "medium", dueDate: "" };

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [query, setQuery] = useState("");

  const load = async () => {
    try {
      setError("");
      setTasks(await api.list());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (!statusFilter || t.status === statusFilter) &&
          t.title.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [tasks, statusFilter, query]
  );

  const counts = useMemo(
    () => Object.fromEntries(STATUSES.map((s) => [s.value, tasks.filter((t) => t.status === s.value).length])),
    [tasks]
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError("Title is required");
    try {
      setError("");
      if (editingId) {
        const saved = await api.update(editingId, form);
        setTasks((prev) => prev.map((t) => (t._id === editingId ? saved : t)));
      } else {
        const created = await api.create(form);
        setTasks((prev) => [created, ...prev]);
      }
      setForm(emptyForm);
      setEditingId(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const startEdit = (t) => {
    setEditingId(t._id);
    setForm({
      title: t.title,
      description: t.description || "",
      priority: t.priority,
      dueDate: t.dueDate ? t.dueDate.slice(0, 10) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Optimistic update: UI changes instantly, rolls back if the API call fails
  const changeStatus = async (task, status) => {
    const previous = tasks;
    setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, status } : t)));
    try {
      await api.update(task._id, { status });
    } catch (e) {
      setTasks(previous);
      setError(e.message);
    }
  };

  const remove = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t._id !== task._id));
    try {
      await api.remove(task._id);
    } catch (e) {
      setTasks(previous);
      setError(e.message);
    }
  };

  const isOverdue = (t) => t.dueDate && t.status !== "done" && new Date(t.dueDate) < new Date(new Date().toDateString());

  return (
    <main className="container">
      <h1>Task Manager</h1>

      <div className="stats">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            className={`stat ${statusFilter === s.value ? "active" : ""}`}
            onClick={() => setStatusFilter(statusFilter === s.value ? "" : s.value)}
          >
            <strong>{counts[s.value]}</strong>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="error" role="alert">
          {error} <button onClick={() => setError("")}>×</button>
        </div>
      )}

      <form className="card form" onSubmit={submit}>
        <h2>{editingId ? "Edit task" : "New task"}</h2>
        <input
          placeholder="Title *"
          value={form.title}
          maxLength={120}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          placeholder="Description (optional)"
          rows={2}
          maxLength={1000}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="row">
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p[0].toUpperCase() + p.slice(1)} priority
              </option>
            ))}
          </select>
          <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        </div>
        <div className="row">
          <button type="submit" className="primary">
            {editingId ? "Save changes" : "Add task"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="toolbar">
        <input placeholder="Search tasks…" value={query} onChange={(e) => setQuery(e.target.value)} />
        {statusFilter && <button onClick={() => setStatusFilter("")}>Clear filter</button>}
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="muted">{tasks.length ? "No tasks match your filters." : "No tasks yet - add your first one above."}</p>
      ) : (
        <ul className="list">
          {visible.map((t) => (
            <li key={t._id} className={`card task ${t.status === "done" ? "done" : ""}`}>
              <div className="task-main">
                <div className="task-title">
                  <span className={`badge ${t.priority}`}>{t.priority}</span>
                  <h3>{t.title}</h3>
                </div>
                {t.description && <p>{t.description}</p>}
                {t.dueDate && (
                  <small className={isOverdue(t) ? "overdue" : "muted"}>
                    Due {new Date(t.dueDate).toLocaleDateString()}
                    {isOverdue(t) && " · overdue"}
                  </small>
                )}
              </div>
              <div className="task-actions">
                <select value={t.status} onChange={(e) => changeStatus(t, e.target.value)}>
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <button onClick={() => startEdit(t)}>Edit</button>
                <button className="danger" onClick={() => remove(t)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
