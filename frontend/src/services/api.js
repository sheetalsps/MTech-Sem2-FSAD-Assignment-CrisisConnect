const GATEWAY = 'http://localhost:4000/api';

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function requestJson(url, options = {}) {
  const headers = { ...options.headers, ...getAuthHeaders() };
  let response;

  try {
    response = await fetch(url, { ...options, headers });
  } catch (networkError) {
    throw new Error('Unable to contact API gateway. Please make sure the backend services are running.');
  }

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody?.details?.length) {
        message = errorBody.details.map((d) => `${d.field}: ${d.message}`).join('; ');
      } else if (errorBody?.error) {
        message = errorBody.error;
      }
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

export function fetchMyRequests() {
  return requestJson(`${GATEWAY}/my-requests`);
}

export function fetchIncident(id) {
  return requestJson(`${GATEWAY}/incidents/${id}`);
}

export function fetchVolunteers() {
  return requestJson(`${GATEWAY}/volunteers`);
}

export function fetchVolunteer(id) {
  return requestJson(`${GATEWAY}/volunteers/${id}`);
}

export async function createVolunteer(payload) {
  return requestJson(`${GATEWAY}/volunteers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function updateVolunteer(id, payload) {
  return requestJson(`${GATEWAY}/volunteers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function deleteVolunteer(id) {
  return requestJson(`${GATEWAY}/volunteers/${id}`, {
    method: 'DELETE'
  });
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

export async function sendIncidentMessage(id, message) {
  return requestJson(`${GATEWAY}/incidents/${id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
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

export async function updateLiveLocation(incidentId, latitude, longitude) {
  return requestJson(`${GATEWAY}/incidents/${incidentId}/live-location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latitude, longitude })
  });
}

export async function fetchNearbyIncidents(lat, lng, radiusKm = 40) {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng), radiusKm: String(radiusKm) });
  return requestJson(`${GATEWAY}/incidents/nearby?${params}`);
}

export async function offerIncidentHelp(incidentId) {
  return requestJson(`${GATEWAY}/incidents/${incidentId}/assignments/offer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
}

export async function staffAssignIncident(incidentId, payload) {
  return requestJson(`${GATEWAY}/incidents/${incidentId}/assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function patchIncidentAssignment(incidentId, volunteerProfileId, payload) {
  return requestJson(`${GATEWAY}/incidents/${incidentId}/assignments/${volunteerProfileId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function registerVolunteerProfile(payload) {
  return requestJson(`${GATEWAY}/volunteers/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function fetchMyVolunteerProfile() {
  return requestJson(`${GATEWAY}/volunteers/me/profile`);
}

/** Returns null when no volunteer profile exists (404). */
export async function fetchMyVolunteerProfileOrNull() {
  const headers = { ...getAuthHeaders() };
  let response;
  try {
    response = await fetch(`${GATEWAY}/volunteers/me/profile`, { headers });
  } catch {
    throw new Error('Unable to contact API gateway.');
  }
  if (response.status === 404) return null;
  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return response.json();
}

export async function patchVolunteerApproval(volunteerId, approvalStatus) {
  return requestJson(`${GATEWAY}/volunteers/${volunteerId}/approval`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approvalStatus })
  });
}

export async function fetchMyAssignments() {
  return requestJson(`${GATEWAY}/my-assignments`);
}

export async function fetchAnalyticsSummary() {
  return requestJson(`${GATEWAY}/analytics/summary`);
}

export async function fetchBroadcasts() {
  return requestJson(`${GATEWAY}/broadcasts`);
}

export async function createBroadcast(payload) {
  return requestJson(`${GATEWAY}/broadcasts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
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