const GATEWAY = 'http://localhost:4000/api';

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function requestJson(url, options = {}) {
  const headers = { ...options.headers, ...getAuthHeaders() };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody && errorBody.error) message = errorBody.error;
    } catch (e) {
      // ignore
    }
    throw new Error(message);
  }
  return response.json();
}

export function fetchIncidents() {
  return requestJson(`${GATEWAY}/incidents`);
}

export function fetchIncident(id) {
  return requestJson(`${GATEWAY}/incidents/${id}`);
}

export function fetchVolunteers() {
  return requestJson(`${GATEWAY}/volunteers`);
}

export function fetchResources() {
  return requestJson(`${GATEWAY}/resources`);
}

export function fetchResource(id) {
  return requestJson(`${GATEWAY}/resources/${id}`);
}

export async function createResource(payload) {
  return requestJson(`${GATEWAY}/resources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function updateResource(id, payload) {
  return requestJson(`${GATEWAY}/resources/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function deleteResource(id) {
  return requestJson(`${GATEWAY}/resources/${id}`, {
    method: 'DELETE'
  });
}

export async function createIncident(payload) {
  const priorityResponse = await requestJson(`${GATEWAY}/priority`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return requestJson(`${GATEWAY}/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, priority: priorityResponse.priority })
  });
}

export async function updateIncident(id, payload) {
  return requestJson(`${GATEWAY}/incidents/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function deleteIncident(id) {
  return requestJson(`${GATEWAY}/incidents/${id}`, {
    method: 'DELETE'
  });
}

export async function login(payload) {
  return requestJson(`${GATEWAY}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function signup(payload) {
  return requestJson(`${GATEWAY}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function fetchProfile() {
  return requestJson(`${GATEWAY}/auth/me`);
}

export async function fetchUsers() {
  return requestJson(`${GATEWAY}/users`);
}

export async function updateUserRole(id, payload) {
  return requestJson(`${GATEWAY}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function deleteUser(id) {
  return requestJson(`${GATEWAY}/users/${id}`, {
    method: 'DELETE'
  });
}

export function logout() {
  localStorage.removeItem('authToken');
}