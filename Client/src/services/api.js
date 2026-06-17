const API_URL = 'http://localhost:8000/api';

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  if (response.status === 24) return null;
  const contentType = response.headers.get('content-type');
  let data = {};
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

export const api = {
  // 1. Auth Endpoints
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  googleLogin: async (credential) => {
    const res = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ credential }),
    });
    return handleResponse(res);
  },

  register: async (email, password, orgName = '') => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password, orgName }),
    });
    return handleResponse(res);
  },

  getMe: async () => {
    const res = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getConfig: async () => {
    const res = await fetch(`${API_URL}/auth/config`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // 2. Organization Endpoints
  getMyOrgs: async () => {
    const res = await fetch(`${API_URL}/organizations/my-orgs`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  createOrg: async (name, slug) => {
    const res = await fetch(`${API_URL}/organizations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, slug }),
    });
    return handleResponse(res);
  },

  getOrgBySlug: async (slug) => {
    const res = await fetch(`${API_URL}/organizations/slug/${slug}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // 3. User Management Endpoints
  getOrgMembers: async (orgUuid) => {
    const res = await fetch(`${API_URL}/organizations/${orgUuid}/users`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  addOrgMember: async (email, orgId, roleName) => {
    const res = await fetch(`${API_URL}/users/organization`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, org_id: orgId, role_name: roleName }),
    });
    return handleResponse(res);
  },

  updateOrgMemberRole: async (orgUuid, userId, roleName) => {
    const res = await fetch(`${API_URL}/organizations/${orgUuid}/users/${userId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ roleName }),
    });
    return handleResponse(res);
  },

  removeOrgMember: async (orgUuid, userId) => {
    const res = await fetch(`${API_URL}/organizations/${orgUuid}/users/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204) return true;
    return handleResponse(res);
  },

  // 4. Course Management Endpoints
  getCoursesByOrg: async (slug) => {
    const res = await fetch(`${API_URL}/courses/org/${slug}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  createCourse: async (orgId, title, description, isPublic = false) => {
    const res = await fetch(`${API_URL}/courses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ org_id: orgId, title, description, public: isPublic }),
    });
    return handleResponse(res);
  },

  updateCourse: async (uuid, updateData) => {
    const res = await fetch(`${API_URL}/courses/${uuid}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updateData),
    });
    return handleResponse(res);
  },

  deleteCourse: async (uuid) => {
    const res = await fetch(`${API_URL}/courses/${uuid}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204) return true;
    return handleResponse(res);
  },

  cloneCourse: async (uuid) => {
    const res = await fetch(`${API_URL}/courses/${uuid}/clone`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  publishCourse: async (uuid) => {
    const res = await fetch(`${API_URL}/courses/${uuid}/publish`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  archiveCourse: async (uuid) => {
    const res = await fetch(`${API_URL}/courses/${uuid}/archive`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  enrollCourse: async (courseId) => {
    const res = await fetch(`${API_URL}/v1/courses/enroll`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ courseId }),
    });
    return handleResponse(res);
  },

  getMyEnrollments: async () => {
    const res = await fetch(`${API_URL}/v1/users/me/enrollments`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};
