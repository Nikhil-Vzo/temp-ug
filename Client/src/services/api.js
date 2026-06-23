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

  getCourse: async (uuid) => {
    const res = await fetch(`${API_URL}/courses/${uuid}`, {
      method: 'GET',
      headers: getHeaders(),
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

  // 5. Cloudinary & Media Uploads
  cloudinaryUpload: async (file, uploadConfig, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    if (uploadConfig.signature) {
      formData.append('api_key', uploadConfig.apiKey);
      formData.append('timestamp', uploadConfig.timestamp);
      formData.append('signature', uploadConfig.signature);
      formData.append('folder', uploadConfig.folder);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadConfig.uploadUrl);

        if (xhr.upload && onProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percentComplete = Math.round((e.loaded / e.total) * 100);
              onProgress(percentComplete);
            }
          };
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response.secure_url || response.url);
            } catch (err) {
              reject(new Error('Failed to parse Cloudinary response'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(formData);
      });
    } else {
      // Simulation for mock S3 uploads
      return new Promise((resolve) => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 20;
          if (onProgress) onProgress(progress);
          if (progress >= 100) {
            clearInterval(interval);
            resolve(uploadConfig.fileKey);
          }
        }, 300);
      });
    }
  },

  generateUploadUrl: async (fileName) => {
    const res = await fetch(`${API_URL}/v1/media/upload-url`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ fileName }),
    });
    return handleResponse(res);
  },

  attachVideo: async (lessonId, fileKey) => {
    const res = await fetch(`${API_URL}/v1/lessons/${lessonId}/content`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ fileKey }),
    });
    return handleResponse(res);
  },

  getStreamingUrl: async (lessonId) => {
    const res = await fetch(`${API_URL}/v1/lessons/${lessonId}/stream`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // 6. Chapters & Syllabus
  getCourseChapters: async (courseUuid) => {
    const res = await fetch(`${API_URL}/chapters/course/${courseUuid}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  createChapter: async (courseUuid, title, description) => {
    const res = await fetch(`${API_URL}/chapters/course/${courseUuid}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title, description }),
    });
    return handleResponse(res);
  },

  reorderChapters: async (courseUuid, reorderData) => {
    const res = await fetch(`${API_URL}/chapters/course/${courseUuid}/reorder`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(reorderData),
    });
    return handleResponse(res);
  },

  deleteChapter: async (chapterUuid) => {
    const res = await fetch(`${API_URL}/chapters/${chapterUuid}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204) return true;
    return handleResponse(res);
  },

  updateChapter: async (chapterUuid, updateData) => {
    const res = await fetch(`${API_URL}/chapters/${chapterUuid}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updateData),
    });
    return handleResponse(res);
  },

  // 7. Sections, Modules & Lessons
  createSection: async (courseId, title) => {
    const res = await fetch(`${API_URL}/v1/courses/${courseId}/sections`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title }),
    });
    return handleResponse(res);
  },

  getSections: async (courseId) => {
    const res = await fetch(`${API_URL}/v1/courses/${courseId}/sections`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  updateSection: async (sectionId, title) => {
    const res = await fetch(`${API_URL}/v1/sections/${sectionId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ title }),
    });
    return handleResponse(res);
  },

  deleteSection: async (sectionId) => {
    const res = await fetch(`${API_URL}/v1/sections/${sectionId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204) return true;
    return handleResponse(res);
  },

  createModule: async (sectionId, title) => {
    const res = await fetch(`${API_URL}/v1/sections/${sectionId}/modules`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title }),
    });
    return handleResponse(res);
  },

  getModules: async (sectionId) => {
    const res = await fetch(`${API_URL}/v1/sections/${sectionId}/modules`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  updateModule: async (moduleId, title) => {
    const res = await fetch(`${API_URL}/v1/modules/${moduleId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ title }),
    });
    return handleResponse(res);
  },

  deleteModule: async (moduleId) => {
    const res = await fetch(`${API_URL}/v1/modules/${moduleId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204) return true;
    return handleResponse(res);
  },

  createLesson: async (moduleId, title, lessonType = 'video') => {
    const res = await fetch(`${API_URL}/v1/modules/${moduleId}/lessons`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title, lessonType }),
    });
    return handleResponse(res);
  },

  getLesson: async (lessonId) => {
    const res = await fetch(`${API_URL}/v1/lessons/${lessonId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  updateLesson: async (lessonId, updateData) => {
    const res = await fetch(`${API_URL}/v1/lessons/${lessonId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updateData),
    });
    return handleResponse(res);
  },

  deleteLesson: async (lessonId) => {
    const res = await fetch(`${API_URL}/v1/lessons/${lessonId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.status === 204) return true;
    return handleResponse(res);
  },

  // 8. Progress Tracking
  startLessonProgress: async (lessonId) => {
    const res = await fetch(`${API_URL}/v1/lessons/${lessonId}/start`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  updateLessonProgress: async (lessonId, completionPercentage, lastPosition = 0) => {
    const res = await fetch(`${API_URL}/v1/lessons/${lessonId}/progress`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ completionPercentage, lastPosition }),
    });
    return handleResponse(res);
  },

  completeLessonProgress: async (lessonId) => {
    const res = await fetch(`${API_URL}/v1/lessons/${lessonId}/complete`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getCourseProgress: async (courseId) => {
    const res = await fetch(`${API_URL}/v1/courses/${courseId}/progress`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getUserCourseProgressRecords: async (courseId) => {
    const res = await fetch(`${API_URL}/v1/courses/${courseId}/progress/records`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // 9. Rewards & Gamification
  getWallet: async () => {
    const res = await fetch(`${API_URL}/v1/rewards/wallet`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getTransactions: async () => {
    const res = await fetch(`${API_URL}/v1/rewards/transactions`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getBadges: async () => {
    const res = await fetch(`${API_URL}/v1/rewards/badges`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getLeaderboard: async () => {
    const res = await fetch(`${API_URL}/v1/rewards/leaderboard`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // 10. Extended PDF, Quiz, Assignment integrations
  attachPdf: async (lessonId, fileKey) => {
    const res = await fetch(`${API_URL}/v1/lessons/${lessonId}/pdf`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ fileKey }),
    });
    return handleResponse(res);
  },

  createAssignment: async (lessonId, title, instructions) => {
    const res = await fetch(`${API_URL}/v1/lessons/${lessonId}/assignments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title, instructions }),
    });
    return handleResponse(res);
  },

  updateAssignment: async (assignmentId, title, instructions) => {
    const res = await fetch(`${API_URL}/v1/assignments/${assignmentId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ title, instructions }),
    });
    return handleResponse(res);
  },

  getMySubmission: async (assignmentId) => {
    const res = await fetch(`${API_URL}/v1/assignments/${assignmentId}/my-submission`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  submitAssignment: async (assignmentId, submissionUrl) => {
    const res = await fetch(`${API_URL}/v1/assignments/${assignmentId}/submissions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ submissionUrl }),
    });
    return handleResponse(res);
  },

  createQuiz: async (lessonId, title, passingScore = 70) => {
    const res = await fetch(`${API_URL}/v1/lessons/${lessonId}/quizzes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title, passingScore }),
    });
    return handleResponse(res);
  },

  updateQuiz: async (quizId, title, passingScore, questions) => {
    const res = await fetch(`${API_URL}/v1/quizzes/${quizId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ title, passingScore, questions }),
    });
    return handleResponse(res);
  },

  getQuizByLesson: async (lessonId) => {
    const res = await fetch(`${API_URL}/v1/lessons/${lessonId}/quiz`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getQuizAdmin: async (quizId) => {
    const res = await fetch(`${API_URL}/v1/quizzes/${quizId}/admin`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  startQuiz: async (quizId) => {
    const res = await fetch(`${API_URL}/v1/quizzes/${quizId}/start`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  submitQuiz: async (quizId, answers) => {
    const res = await fetch(`${API_URL}/v1/quizzes/${quizId}/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ answers }),
    });
    return handleResponse(res);
  },

  getQuizResult: async (quizId) => {
    const res = await fetch(`${API_URL}/v1/quizzes/${quizId}/result`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};
