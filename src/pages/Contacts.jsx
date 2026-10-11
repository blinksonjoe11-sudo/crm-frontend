import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Trash2,
  Mail,
  Phone,
  Users,
  Upload,
  CheckCircle,
  Loader,
} from "lucide-react";
import { api } from "../lib/api";
import {
  Button,
  Input,
  Modal,
  Badge,
  Empty,
  Spinner,
  Avatar,
  PageHeader,
  Toast,
  Select,
} from "../components/ui";
import { format } from "date-fns";

function ContactForm({ initial = {}, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    first_name: initial.first_name || "",
    last_name: initial.last_name || "",
    email: initial.email || "",
    phone: initial.phone || "",
    title: initial.title || "",
    source: initial.source || "website",
    tags: (initial.tags || []).join(", "),
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
    };
    if (form.phone.trim()) payload.phone = form.phone.trim();
    if (form.title.trim()) payload.title = form.title.trim();
    if (form.source) payload.source = form.source;
    if (form.tags.trim())
      payload.tags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    onSave(payload);
  };

  return (
    <form
      onSubmit={submit}
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Input
          label="First name *"
          value={form.first_name}
          onChange={set("first_name")}
          required
        />
        <Input
          label="Last name *"
          value={form.last_name}
          onChange={set("last_name")}
          required
        />
      </div>
      <Input
        label="Email *"
        type="email"
        value={form.email}
        onChange={set("email")}
        required
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Input
          label="Phone"
          value={form.phone}
          onChange={set("phone")}
          placeholder="+1 555 000 0000"
        />
        <Input
          label="Title"
          value={form.title}
          onChange={set("title")}
          placeholder="CEO, Manager..."
        />
      </div>
      <Select label="Source" value={form.source} onChange={set("source")}>
        {[
          "website",
          "referral",
          "cold_outreach",
          "social_media",
          "event",
          "other",
        ].map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </option>
        ))}
      </Select>
      <Input
        label="Tags (comma separated)"
        value={form.tags}
        onChange={set("tags")}
        placeholder="vip, lead, customer"
      />
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "flex-end",
          marginTop: 4,
        }}
      >
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Save contact
        </Button>
      </div>
    </form>
  );
}

function ImportModal({ open, onClose, onSuccess }) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | uploading | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const reset = () => {
    setFile(null);
    setStatus("idle");
    setResult(null);
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["csv", "json"].includes(ext)) {
      setError("Only .csv and .json files are supported");
      return;
    }
    setError("");
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleImport = async () => {
    if (!file) return;
    setStatus("uploading");
    setError("");
    try {
      const res = await api.importContacts(file);
      setResult(res.data);
      setStatus("done");
      onSuccess();
    } catch (e) {
      setError(e.message);
      setStatus("error");
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Import Contacts">
      {status === "done" ? (
        // Success state
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            padding: "8px 0 4px",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "var(--green-dim)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircle size={26} color="var(--green)" />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
              Import queued
            </div>
            <div style={{ fontSize: 13, color: "var(--text-2)" }}>
              {result?.total_rows} rows are being processed in the background.
              Your contacts list will update shortly.
            </div>
          </div>
          <div
            style={{
              background: "var(--bg-3)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "10px 16px",
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
            }}
          >
            <span style={{ color: "var(--text-2)" }}>Status</span>
            <span
              style={{
                color: "var(--amber)",
                fontWeight: 500,
                textTransform: "capitalize",
              }}
            >
              {result?.status}
            </span>
          </div>
          <Button
            onClick={handleClose}
            style={{ width: "100%", justifyContent: "center" }}
          >
            Done
          </Button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Format note */}
          <div
            style={{
              background: "var(--bg-3)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "10px 14px",
              fontSize: 12,
              color: "var(--text-2)",
              lineHeight: 1.6,
            }}
          >
            Accepted formats:{" "}
            <strong style={{ color: "var(--text)" }}>.csv</strong> and{" "}
            <strong style={{ color: "var(--text)" }}>.json</strong>
            <br />
            CSV headers:{" "}
            <code
              style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}
            >
              first_name, last_name, email, phone, title, tags
            </code>
          </div>

          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragging ? "var(--accent)" : file ? "var(--green)" : "var(--border-2)"}`,
              borderRadius: "var(--radius-lg)",
              padding: "28px 20px",
              textAlign: "center",
              cursor: "pointer",
              background: dragging
                ? "var(--accent-dim)"
                : file
                  ? "var(--green-dim)"
                  : "var(--bg-3)",
              transition: "all 0.15s",
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.json"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
            {file ? (
              <>
                <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--green)",
                  }}
                >
                  {file.name}
                </div>
                <div
                  style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}
                >
                  {(file.size / 1024).toFixed(1)} KB · click to change
                </div>
              </>
            ) : (
              <>
                <Upload
                  size={24}
                  style={{ color: "var(--text-3)", margin: "0 auto 8px" }}
                />
                <div style={{ fontSize: 13, fontWeight: 500 }}>
                  Drop your file here
                </div>
                <div
                  style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}
                >
                  or click to browse
                </div>
              </>
            )}
          </div>

          {error && (
            <div
              style={{
                fontSize: 12,
                color: "var(--red)",
                background: "var(--red-dim)",
                border: "1px solid var(--red-dim)",
                borderRadius: "var(--radius)",
                padding: "8px 12px",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              loading={status === "uploading"}
              disabled={!file || status === "uploading"}
            >
              {status === "uploading" ? "Uploading…" : "Import contacts"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function Contacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'import'
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 20 };
      if (search) params.search = search;
      const res = await api.getContacts(params);
      setContacts(res.data || []);
      setMeta(res.meta || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreate = async (data) => {
    setSaving(true);
    try {
      await api.createContact(data);
      setModal(null);
      showToast("Contact created");
      load();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (data) => {
    setSaving(true);
    try {
      await api.updateContact(editing.id, data);
      setModal(null);
      setEditing(null);
      showToast("Contact updated");
      load();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this contact?")) return;
    setDeleting(id);
    try {
      await api.deleteContact(id);
      showToast("Contact deleted");
      load();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div style={{ padding: "28px 32px", animation: "fadeIn 0.2s ease" }}>
      <PageHeader
        title="Contacts"
        description={`${meta.total || 0} contacts in your workspace`}
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={() => setModal("import")}>
              <Upload size={14} />
              Import
            </Button>
            <Button onClick={() => setModal("create")}>
              <Plus size={14} />
              New contact
            </Button>
          </div>
        }
      />

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 340 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-3)",
              pointerEvents: "none",
            }}
          />
          <input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              width: "100%",
              background: "var(--bg-3)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              color: "var(--text)",
              padding: "8px 12px 8px 32px",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>
      </div>

      <div
        style={{
          background: "var(--bg-2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-3)" }}>
              {[
                "Name",
                "Email",
                "Phone",
                "Title",
                "Tags",
                "Score",
                "Added",
                "",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 16px",
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--text-2)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: "center" }}>
                  <Spinner />
                </td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <Empty
                    icon={Users}
                    title="No contacts found"
                    description="Create your first contact or import a file"
                    action={
                      <div style={{ display: "flex", gap: 8 }}>
                        <Button
                          variant="secondary"
                          onClick={() => setModal("import")}
                        >
                          <Upload size={13} />
                          Import
                        </Button>
                        <Button onClick={() => setModal("create")}>
                          <Plus size={13} />
                          Add contact
                        </Button>
                      </div>
                    }
                  />
                </td>
              </tr>
            ) : (
              contacts.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/contacts/${c.id}`)}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    transition: "background 0.1s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--bg-3)")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <Avatar
                        name={`${c.first_name} ${c.last_name}`}
                        size={30}
                      />
                      <div style={{ fontSize: 13, fontWeight: 500 }}>
                        {c.first_name} {c.last_name}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 13,
                        color: "var(--text-2)",
                      }}
                    >
                      <Mail
                        size={11}
                        style={{ color: "var(--text-3)", flexShrink: 0 }}
                      />
                      <span className="truncate" style={{ maxWidth: 160 }}>
                        {c.email}
                      </span>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: 13,
                      color: "var(--text-2)",
                    }}
                  >
                    {c.phone ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <Phone size={11} style={{ color: "var(--text-3)" }} />
                        {c.phone}
                      </div>
                    ) : (
                      <span style={{ color: "var(--text-3)" }}>—</span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: 13,
                      color: "var(--text-2)",
                    }}
                  >
                    {c.title || "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {(c.tags || []).slice(0, 2).map((t) => (
                        <Badge key={t}>{t}</Badge>
                      ))}
                      {(c.tags || []).length > 2 && (
                        <Badge>+{c.tags.length - 2}</Badge>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: c.score > 50 ? "var(--green)" : "var(--text-2)",
                      }}
                    >
                      {c.score ?? 0}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: 12,
                      color: "var(--text-3)",
                    }}
                  >
                    {format(new Date(c.created_at), "MMM d, yyyy")}
                  </td>
                  <td
                    style={{ padding: "12px 16px" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        onClick={() => {
                          setEditing(c);
                          setModal("edit");
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-3)",
                          cursor: "pointer",
                          padding: 4,
                          borderRadius: 4,
                        }}
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deleting === c.id}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-3)",
                          cursor: "pointer",
                          padding: 4,
                          borderRadius: 4,
                          display: "flex",
                          alignItems: "center",
                        }}
                        title="Delete"
                      >
                        {deleting === c.id ? (
                          <Spinner size={12} />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {meta.total > 20 && (
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12,
              color: "var(--text-2)",
            }}
          >
            <span>
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, meta.total)} of{" "}
              {meta.total}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page * 20 >= meta.total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={modal === "create"}
        onClose={() => setModal(null)}
        title="New Contact"
      >
        <ContactForm
          onSave={handleCreate}
          onCancel={() => setModal(null)}
          loading={saving}
        />
      </Modal>

      <Modal
        open={modal === "edit"}
        onClose={() => {
          setModal(null);
          setEditing(null);
        }}
        title="Edit Contact"
      >
        {editing && (
          <ContactForm
            initial={editing}
            onSave={handleEdit}
            onCancel={() => {
              setModal(null);
              setEditing(null);
            }}
            loading={saving}
          />
        )}
      </Modal>

      <ImportModal
        open={modal === "import"}
        onClose={() => setModal(null)}
        onSuccess={() => {
          showToast("Import queued — contacts will appear shortly");
          setTimeout(() => load(), 3000); // reload after a short delay to catch processed rows
        }}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
