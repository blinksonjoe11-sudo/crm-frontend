import { useState, useEffect, useCallback } from "react";
import { Plus, Activity, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import {
  Button,
  Modal,
  Badge,
  Empty,
  Spinner,
  PageHeader,
  Toast,
  Select,
  Input,
  Textarea,
} from "../components/ui";
import { format } from "date-fns";

const typeIcon = { call: "📞", note: "📝", email: "✉️", meeting: "🤝" };
const typeColor = {
  call: "blue",
  note: "default",
  email: "accent",
  meeting: "green",
};

function toLocalDatetimeValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().slice(0, 16);
}

function toAPIString(localDatetimeValue) {
  if (!localDatetimeValue) return new Date().toISOString();
  return new Date(localDatetimeValue + ":00").toISOString();
}

export default function Activities() {
  const [activities, setActivities] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    type: "note",
    subject: "",
    body: "",
    duration: "",
    occurred_at: toLocalDatetimeValue(),
  });

  const showToast = (msg, type = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 25 };
      if (filterType) params.type = filterType;
      const res = await api.getActivities(params);
      setActivities(res?.data || []);
      setMeta(res?.meta || {});
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, filterType]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createActivity({
        type: form.type,
        subject: form.subject,
        body: form.body,
        ...(form.duration ? { duration: parseInt(form.duration, 10) } : {}),
        occurred_at: toAPIString(form.occurred_at),
      });
      setModal(false);
      setForm({
        type: "note",
        subject: "",
        body: "",
        duration: "",
        occurred_at: toLocalDatetimeValue(),
      });
      showToast("Activity logged");
      load();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete activity?")) return;
    try {
      await api.deleteActivity(id);
      showToast("Deleted");
      load();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  return (
    <div style={{ padding: "28px 32px", animation: "fadeIn 0.2s ease" }}>
      <PageHeader
        title="Activities"
        description={`${meta.total || 0} activities logged`}
        action={
          <Button onClick={() => setModal(true)}>
            <Plus size={14} />
            Log activity
          </Button>
        }
      />

      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 20,
          background: "var(--bg-2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: 4,
          width: "fit-content",
        }}
      >
        {[
          ["", "All"],
          ["call", "Calls"],
          ["note", "Notes"],
          ["email", "Emails"],
          ["meeting", "Meetings"],
        ].map(([val, label]) => (
          <button
            key={val}
            onClick={() => {
              setFilterType(val);
              setPage(1);
            }}
            style={{
              padding: "5px 14px",
              borderRadius: 5,
              border: "none",
              cursor: "pointer",
              background: filterType === val ? "var(--bg-4)" : "transparent",
              color: filterType === val ? "var(--text)" : "var(--text-2)",
              fontSize: 13,
              fontWeight: filterType === val ? 500 : 400,
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <Spinner size={24} />
        </div>
      ) : activities.length === 0 ? (
        <Empty
          icon={Activity}
          title="No activities yet"
          description="Log your first call, note, email or meeting"
          action={
            <Button onClick={() => setModal(true)}>
              <Plus size={13} />
              Log activity
            </Button>
          }
        />
      ) : (
        <div
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          {activities.map((act, i) => (
            <div
              key={act.id}
              style={{
                padding: "14px 20px",
                borderBottom:
                  i < activities.length - 1
                    ? "1px solid var(--border)"
                    : "none",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg-3)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
            >
              <div style={{ fontSize: 22, flexShrink: 0 }}>
                {typeIcon[act.type] || "•"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 3,
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {act.subject}
                  </span>
                  <Badge color={typeColor[act.type] || "default"}>
                    {act.type}
                  </Badge>
                  {act.duration && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--text-3)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {act.duration} min
                    </span>
                  )}
                </div>
                {act.body && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-2)",
                      marginBottom: 4,
                    }}
                  >
                    {act.body}
                  </div>
                )}
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                  {act.occurred_at
                    ? format(
                        new Date(act.occurred_at),
                        "EEEE, MMM d, yyyy · h:mm a",
                      )
                    : ""}
                </div>
              </div>
              <button
                onClick={() => handleDelete(act.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-3)",
                  cursor: "pointer",
                  padding: 4,
                  borderRadius: 4,
                  display: "flex",
                  flexShrink: 0,
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {meta.total > 25 && (
            <div
              style={{
                padding: "12px 20px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 12,
                color: "var(--text-2)",
              }}
            >
              <span>
                {(page - 1) * 25 + 1}–{Math.min(page * 25, meta.total)} of{" "}
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
                  disabled={page * 25 >= meta.total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Log Activity">
        <form
          onSubmit={handleCreate}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <Select label="Type" value={form.type} onChange={set("type")}>
            {["call", "note", "email", "meeting"].map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </Select>
          <Input
            label="Subject *"
            value={form.subject}
            onChange={set("subject")}
            required
          />
          <Textarea label="Notes" value={form.body} onChange={set("body")} />
          {(form.type === "call" || form.type === "meeting") && (
            <Input
              label="Duration (min)"
              type="number"
              value={form.duration}
              onChange={set("duration")}
              min={1}
            />
          )}
          <Input
            label="Date & Time"
            type="datetime-local"
            value={form.occurred_at}
            onChange={set("occurred_at")}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Log activity
            </Button>
          </div>
        </form>
      </Modal>

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
