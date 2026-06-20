import { useEffect, useState } from "react";

const defaultForm = {
  title: "",
  body: "",
  category: "Exam",
  priority: "Normal",
  publishDate: "",
  image: "",
};

const categories = ["Exam", "Event", "General"];
const priorities = ["Normal", "Urgent"];

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function toInputDate(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

async function readResponseError(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => null);
    return data?.error || `Request failed with status ${response.status}.`;
  }

  const text = await response.text().catch(() => "");
  return text ? text.slice(0, 180) : `Request failed with status ${response.status}.`;
}

export default function Home() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    let cancelled = false;

    async function loadNotices() {
    try {
      const res = await fetch("/api/notices");
      const data = await res.json().catch(async () => ({ error: await readResponseError(res) }));

        if (!res.ok) {
          throw new Error(data.error || "Failed to load notices.");
        }

        if (!cancelled) {
          setNotices(data.data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load notices.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadNotices();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function startEditing(notice) {
    setEditingId(notice.id);
    setForm({
      title: notice.title,
      body: notice.body,
      category: notice.category,
      priority: notice.priority,
      publishDate: toInputDate(notice.publishDate),
      image: notice.image || "",
    });
    setFieldErrors({});
    setMessage("");
    setError("");
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(defaultForm);
    setFieldErrors({});
  }

  async function saveNotice(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    setFieldErrors({});

    const endpoint = editingId ? `/api/notices/${editingId}` : "/api/notices";
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(async () => ({ error: await readResponseError(res) }));

      if (!res.ok) {
        if (data.fields) {
          setFieldErrors(data.fields);
        }
        throw new Error(data.error || "Unable to save notice.");
      }

      if (editingId) {
        setNotices((current) =>
          current.map((notice) => (notice.id === data.data.id ? data.data : notice)),
        );
        cancelEditing();
        setMessage("Notice updated successfully.");
      } else {
        setNotices((current) => [data.data, ...current]);
        setForm(defaultForm);
        setMessage("Notice created successfully.");
      }
    } catch (err) {
      setError(err.message || "Unable to save notice.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteNotice(notice) {
    if (!window.confirm(`Delete "${notice.title}"?`)) return;

    try {
      const res = await fetch(`/api/notices/${notice.id}`, { method: "DELETE" });

      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(async () => ({ error: await readResponseError(res) }));
        throw new Error(data.error || "Unable to delete notice.");
      }

      setNotices((current) => current.filter((item) => item.id !== notice.id));
      if (editingId === notice.id) {
        cancelEditing();
      }
      setMessage("Notice deleted.");
    } catch (err) {
      setError(err.message || "Unable to delete notice.");
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Reno notice board</p>
          
        </div>
      
      </section>

      <section className="content-grid">
        <form className="card notice-form" onSubmit={saveNotice}>
          <div className="card-heading">
            <div>
              <p className="section-label">{editingId ? "Edit Notice" : "Add Notice"}</p>
              <h2>{editingId ? "Update notice" : "Create notice"}</h2>
            </div>
            {editingId ? (
              <button type="button" className="ghost-button" onClick={cancelEditing}>
                Cancel
              </button>
            ) : null}
          </div>

          <div className="form-grid">
            <label>
              <span>Title</span>
              <input
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Exam schedule"
              />
              {fieldErrors.title ? <em>{fieldErrors.title}</em> : null}
            </label>

            <label className="full-span">
              <span>Body</span>
              <textarea
                rows="5"
                value={form.body}
                onChange={(e) => updateField("body", e.target.value)}
                placeholder="Full notice details"
              />
              {fieldErrors.body ? <em>{fieldErrors.body}</em> : null}
            </label>

            <label>
              <span>Category</span>
              <select
                className="category-select"
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {fieldErrors.category ? <em>{fieldErrors.category}</em> : null}
            </label>

            <label>
              <span>Priority</span>
              <select
                className="priority-select"
                value={form.priority}
                onChange={(e) => updateField("priority", e.target.value)}
              >
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
              {fieldErrors.priority ? <em>{fieldErrors.priority}</em> : null}
            </label>

            <label>
              <span>Publish Date</span>
              <input
                type="date"
                value={form.publishDate}
                onChange={(e) => updateField("publishDate", e.target.value)}
              />
              {fieldErrors.publishDate ? <em>{fieldErrors.publishDate}</em> : null}
            </label>

          </div>

          {error ? <p className="banner error">{error}</p> : null}
          {message ? <p className="banner success">{message}</p> : null}

          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update notice" : "Create notice"}
            </button>
            <button type="button" className="secondary-button" onClick={() => window.location.reload()}>
              Refresh
            </button>
          </div>
        </form>

        <section className="card notices-section">
          <div className="card-heading">
            <div>
              <p className="section-label">Notice List</p>
              <h2>Urgent notices first</h2>
            </div>
            <span className="count-pill">{notices.length}</span>
          </div>

          {loading ? <p className="placeholder">Loading notices...</p> : null}
          {!loading && notices.length === 0 ? (
            <p className="placeholder">No notices yet. Create the first one.</p>
          ) : null}

          <div className="notice-grid">
            {notices.map((notice) => (
              <article
                key={notice.id}
                className={`notice-card ${notice.priority === "Urgent" ? "urgent" : ""}`}
              >
                {notice.image ? (
                  <div className="notice-image-wrap">
                    <img className="notice-image" src={notice.image} alt={notice.title} />
                  </div>
                ) : null}
                <div className="notice-card-top">
                  <div className="pill-row">
                    <span className="pill">{notice.category}</span>
                    <span className={`pill ${notice.priority === "Urgent" ? "urgent-pill" : ""}`}>
                      {notice.priority}
                    </span>
                  </div>
                  <span className="publish-date">{formatDate(notice.publishDate)}</span>
                </div>
                <h3>{notice.title}</h3>
                <p>{notice.body}</p>
                <div className="notice-actions">
                  <button className="ghost-button" type="button" onClick={() => startEditing(notice)}>
                    Edit
                  </button>
                  <button className="danger-button" type="button" onClick={() => deleteNotice(notice)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
