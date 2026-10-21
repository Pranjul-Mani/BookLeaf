const API_BASE = "/api";

function getHeaders(customHeaders = {}) {
  const token = localStorage.getItem("bookleaf_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders
  };
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: getHeaders(options.headers)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  }),
  getMe: () => request("/auth/me"),
  getDemoUsers: () => request("/auth/demo-users"),

  // Books
  getMyBooks: () => request("/books/my-books"),
  getAllBooks: (params = "") => request(`/books/all${params}`),
  getBookById: (id) => request(`/books/${id}`),

  // Tickets
  getTickets: (queryString = "") => request(`/tickets${queryString}`),
  getTicketStats: () => request("/tickets/stats/summary"),
  getTicketById: (id) => request(`/tickets/${id}`),
  createTicket: (payload) => request("/tickets", {
    method: "POST",
    body: JSON.stringify(payload)
  }),
  updateTicket: (id, payload) => request(`/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  }),
  addMessage: (id, payload) => request(`/tickets/${id}/messages`, {
    method: "POST",
    body: JSON.stringify(payload)
  }),
  addInternalNote: (id, note) => request(`/tickets/${id}/internal-notes`, {
    method: "POST",
    body: JSON.stringify({ note })
  }),
  regenerateAiDraft: (id) => request(`/tickets/${id}/ai-draft`, {
    method: "POST"
  })
};
