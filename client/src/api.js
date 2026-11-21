const BASE = "/api/tasks";

async function request(url, options) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  list: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return request(`${BASE}${qs ? `?${qs}` : ""}`);
  },
  create: (task) => request(BASE, { method: "POST", body: JSON.stringify(task) }),
  update: (id, patch) => request(`${BASE}/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  remove: (id) => request(`${BASE}/${id}`, { method: "DELETE" }),
};
