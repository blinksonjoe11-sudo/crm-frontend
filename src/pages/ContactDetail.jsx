import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Mail, Clock, Plus, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import {
  Card,
  Badge,
  Button,
  Modal,
  Spinner,
  Avatar,
  Toast,
  Select,
  Input,
  Textarea,
} from "../components/ui";
import { format } from "date-fns";

const activityTypes = ["call", "note", "email", "meeting"];
const typeIcon = { call: "📞", note: "📝", email: "✉️", meeting: "🤝" };

function toLocalDatetimeValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().slice(0, 16);
}

function toAPIString(localDatetimeValue) {
  if (!localDatetimeValue) return new Date().toISOString();
  // datetime-local gives "2026-03-10T14:30" — append seconds so Date parses it correctly
  return new Date(localDatetimeValue + ":00").toISOString();
}

function ActivityForm({ contactId, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    type: "note",
    subject: "",
    body: "",
    duration: "",
    occurred_at: toLocalDatetimeValue(),
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    onSave({
      type: form.type,
      subject: form.subject,
      body: form.body,
      contact_id: contactId,
      ...(form.duration ? { duration: parseInt(form.duration, 10) } : {}),
      occurred_at: toAPIString(form.occurred_at),
    });
  };

  return (
    <form
      onSubmit={submit}
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      <Select label="Type" value={form.type} onChange={set("type")}>
        {activityTypes.map((t) => (
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
          label="Duration (minutes)"
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
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Log activity
        </Button>
      </div>
    </form>
  );
}

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    try {
      const [cRes, aRes] = await Promise.all([
        api.getContact(id),
        api.getActivities({ contact_id: id }),
      ]);
      setContact(cRes.data);
      setActivities(aRes?.data || []);
    } catch {
      navigate("/contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleActivity = async (data) => {
    setSaving(true);
    try {
      await api.createActivity(data);
      setModal(null);
      showToast("Activity logged");
      load();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteActivity = async (aid) => {
    if (!window.confirm("Delete this activity?")) return;
    try {
      await api.deleteActivity(aid);
      showToast("Activity deleted");
      load();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  if (loading)
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spinner size={24} />
      </div>
    );
  if (!contact) return null;

  return (
    <div
      style={{
        padding: "28px 32px",
        animation: "fadeIn 0.2s ease",
        maxWidth: 900,
      }}
    >
      <button
        onClick={() => navigate("/contacts")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          color: "var(--text-2)",
          cursor: "pointer",
          fontSize: 13,
          marginBottom: 20,
          padding: 0,
        }}
      >
        <ArrowLeft size={14} /> Back to contacts
      </button>

      <div
        style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card
            style={{
              padding: 24,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              textAlign: "center",
            }}
          >
            <Avatar
              name={`${contact.first_name} ${contact.last_name}`}
              size={56}
            />
            <div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                }}
              >
                {contact.first_name} {contact.last_name}
              </h2>
              {contact.title && (
                <div
                  style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}
                >
                  {contact.title}
                </div>
              )}
            </div>
            {(contact.tags || []).length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                {contact.tags.map((t) => (
                  <Badge key={t} color="accent">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </Card>

          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--border)",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-3)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Contact info
            </div>
            <div style={{ padding: "4px 0" }}>
              {[
                { icon: Mail, label: "Email", value: contact.email },
                { icon: Phone, label: "Phone", value: contact.phone || "—" },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  style={{
                    padding: "10px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <Icon
                    size={13}
                    style={{ color: "var(--text-3)", flexShrink: 0 }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--text-3)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ fontSize: 13 }}>{value}</div>
                  </div>
                </div>
              ))}
              <div
                style={{
                  padding: "10px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Clock
                  size={13}
                  style={{ color: "var(--text-3)", flexShrink: 0 }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text-3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Added
                  </div>
                  <div style={{ fontSize: 13 }}>
                    {format(new Date(contact.created_at), "MMM d, yyyy")}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card style={{ padding: 16 }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-3)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 600,
                marginBottom: 10,
              }}
            >
              Lead score
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                fontFamily: "var(--font-display)",
                color: "var(--accent)",
              }}
            >
              {contact.score ?? 0}
            </div>
            <div
              style={{
                height: 4,
                background: "var(--bg-3)",
                borderRadius: 2,
                marginTop: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(contact.score || 0, 100)}%`,
                  height: "100%",
                  background: "var(--accent)",
                  borderRadius: 2,
                }}
              />
            </div>
          </Card>
        </div>

        <Card>
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>
              Activity ({activities.length})
            </h3>
            <Button size="sm" onClick={() => setModal("activity")}>
              <Plus size={12} />
              Log activity
            </Button>
          </div>
          <div style={{ padding: activities.length === 0 ? 0 : "8px 0" }}>
            {activities.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🗒️</div>
                <div style={{ fontSize: 13, color: "var(--text-2)" }}>
                  No activities yet
                </div>
                <Button
                  size="sm"
                  onClick={() => setModal("activity")}
                  style={{ marginTop: 12 }}
                >
                  <Plus size={12} />
                  Log first activity
                </Button>
              </div>
            ) : (
              activities.map((act, i) => (
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
                  }}
                >
                  <div style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>
                    {typeIcon[act.type] || "•"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        marginBottom: 2,
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 500 }}>
                        {act.subject}
                      </span>
                      <Badge>{act.type}</Badge>
                    </div>
                    {act.body && (
                      <div
                        style={{
                          fontSize: 12,
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
                            "MMM d, yyyy · h:mm a",
                          )
                        : ""}
                      {act.duration ? ` · ${act.duration} min` : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteActivity(act.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-3)",
                      cursor: "pointer",
                      padding: 4,
                      borderRadius: 4,
                      alignSelf: "flex-start",
                      display: "flex",
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Modal
        open={modal === "activity"}
        onClose={() => setModal(null)}
        title="Log Activity"
      >
        <ActivityForm
          contactId={id}
          onSave={handleActivity}
          onCancel={() => setModal(null)}
          loading={saving}
        />
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
