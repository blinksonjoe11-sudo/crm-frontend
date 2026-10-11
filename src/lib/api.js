const BASE_URL = "http://localhost:8080/api/v1";

function getToken() {
  return localStorage.getItem("crm_token");
}

function setToken(token) {
  localStorage.setItem("crm_token", token);
}

let refreshPromise = null;

async function refreshToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  })
    .then((res) => res.json())
    .then((body) => {
      if (!body.success) throw new Error("Refresh failed");
      setToken(body.data.access_token);
      return body.data.access_token;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

async function request(path, options = {}, isRetry = false) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  // Never set Content-Type for FormData — the browser must set it with the
  // correct multipart boundary. For everything else default to JSON.
  const headers = isFormData ? {} : { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && !isRetry) {
    try {
      await refreshToken();
      return request(path, options, true);
    } catch {
      localStorage.removeItem("crm_token");
      window.dispatchEvent(new Event("crm:session-expired"));
      throw new Error("Session expired. Please log in again.");
    }
  }

  if (res.status === 204) return null;

  const body = await res.json();
  if (!body.success) throw new Error(body.error?.message || "Request failed");

  const { success, ...rest } = body;
  return rest;
}

export const api = {
  // Auth
  login: (body) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  register: (body) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  me: () => request("/auth/me"),
  refresh: () => request("/auth/refresh"),
  logout: () => request("/auth/logout", { method: "POST" }),
  changePassword: (body) =>
    request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // Contacts
  getContacts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/contacts${q ? "?" + q : ""}`);
  },
  getContact: (id) => request(`/contacts/${id}`),
  createContact: (body) =>
    request("/contacts", { method: "POST", body: JSON.stringify(body) }),
  updateContact: (id, body) =>
    request(`/contacts/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteContact: (id) => request(`/contacts/${id}`, { method: "DELETE" }),
  importContacts: (file) => {
    const form = new FormData();
    form.append("file", file);
    return request("/contacts/import", { method: "POST", body: form });
  },

  // Deals
  getDeals: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/deals${q ? "?" + q : ""}`);
  },
  getDeal: (id) => request(`/deals/${id}`),
  createDeal: (body) =>
    request("/deals", { method: "POST", body: JSON.stringify(body) }),
  updateDeal: (id, body) =>
    request(`/deals/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  moveDealStage: (id, stage_id) =>
    request(`/deals/${id}/stage`, {
      method: "PATCH",
      body: JSON.stringify({ stage_id }),
    }),
  markDealWon: (id) => request(`/deals/${id}/won`, { method: "POST" }),
  markDealLost: (id, reason) =>
    request(`/deals/${id}/lost`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  deleteDeal: (id) => request(`/deals/${id}`, { method: "DELETE" }),
  linkContact: (dealId, contactId) =>
    request(`/deals/${dealId}/contacts/${contactId}`, { method: "POST" }),
  unlinkContact: (dealId, contactId) =>
    request(`/deals/${dealId}/contacts/${contactId}`, { method: "DELETE" }),

  // Pipelines
  getPipelines: () => request("/pipelines"),
  getPipeline: (id) => request(`/pipelines/${id}`),
  createPipeline: (body) =>
    request("/pipelines", { method: "POST", body: JSON.stringify(body) }),
  deletePipeline: (id) => request(`/pipelines/${id}`, { method: "DELETE" }),

  // Activities
  getActivities: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/activities${q ? "?" + q : ""}`);
  },
  createActivity: (body) =>
    request("/activities", { method: "POST", body: JSON.stringify(body) }),
  updateActivity: (id, body) =>
    request(`/activities/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteActivity: (id) => request(`/activities/${id}`, { method: "DELETE" }),

  // Tasks
  getTasks: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/tasks${q ? "?" + q : ""}`);
  },
  createTask: (body) =>
    request("/tasks", { method: "POST", body: JSON.stringify(body) }),
  updateTask: (id, body) =>
    request(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  completeTask: (id) => request(`/tasks/${id}/complete`, { method: "POST" }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
};
