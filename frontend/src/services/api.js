const GATEWAY = 'http://localhost:4000/api';

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
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
