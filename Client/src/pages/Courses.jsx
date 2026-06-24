import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Trash2, Edit3, Copy, Eye, EyeOff, X, Check } from 'lucide-react';
import { api } from '../services/api';

export default function Courses() {
  const { activeOrg } = useOutletContext();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeOrg) {
      fetchCourses();
    }
  }, [activeOrg]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.getCoursesByOrg(activeOrg.slug);
      setCourses(res.data.courses || []);
    } catch (err) {
      setError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const clearAlerts = () => {
    setError('');
    setSuccess('');
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!title) return;
    setSaving(true);
    clearAlerts();

    try {
      await api.createCourse(activeOrg._id, title, description, isPublic);
      setSuccess('Course created successfully!');
      setTitle('');
      setDescription('');
      setIsPublic(false);
      setShowAddForm(false);
      await fetchCourses();
    } catch (err) {
      setError(err.message || 'Failed to create course');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (course) => {
    setEditingCourse(course);
    setTitle(course.title);
    setDescription(course.description || '');
    setIsPublic(course.public || false);
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;
    setSaving(true);
    clearAlerts();

    try {
      await api.updateCourse(editingCourse.course_uuid, {
        title,
        description,
        public: isPublic,
      });
      setSuccess('Course updated successfully!');
      setEditingCourse(null);
      setTitle('');
      setDescription('');
      setIsPublic(false);
      await fetchCourses();
    } catch (err) {
      setError(err.message || 'Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (uuid) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    clearAlerts();

    try {
      await api.deleteCourse(uuid);
      setSuccess('Course deleted successfully!');
      await fetchCourses();
    } catch (err) {
      setError(err.message || 'Failed to delete course');
    }
  };

  const handleCloneCourse = async (uuid) => {
    clearAlerts();
    try {
      await api.cloneCourse(uuid);
      setSuccess('Course cloned successfully!');
      await fetchCourses();
    } catch (err) {
      setError(err.message || 'Failed to clone course');
    }
  };

  const handleTogglePublish = async (course) => {
    clearAlerts();
    try {
      if (course.published) {
        await api.archiveCourse(course.course_uuid);
        setSuccess('Course archived successfully!');
      } else {
        await api.publishCourse(course.course_uuid);
        setSuccess('Course published successfully!');
      }
      await fetchCourses();
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  return (
    <div className="courses-container">
      <div className="content-header">
        <div>
          <h2>Manage Courses</h2>
          <p>Create, update, clone, and publish syllabus modules</p>
        </div>
        {!showAddForm && !editingCourse && (
          <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
            <Plus size={18} /> New Course
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Add / Edit Form */}
      {(showAddForm || editingCourse) && (
        <div className="form-card">
          <div className="form-card-header">
            <h3>{editingCourse ? 'Edit Course' : 'Create New Course'}</h3>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingCourse(null);
                setTitle('');
                setDescription('');
                setIsPublic(false);
              }}
              className="btn-close"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse}>
            <div className="form-group">
              <label htmlFor="courseTitle">Course Title</label>
              <input
                id="courseTitle"
                type="text"
                placeholder="e.g. Advanced TypeScript Patterns"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="courseDesc">Description</label>
              <textarea
                id="courseDesc"
                placeholder="Write a brief overview of what students will learn..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="form-group-toggle">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                <span className="toggle-text">Make this course public</span>
              </label>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingCourse(null);
                  setTitle('');
                  setDescription('');
                  setIsPublic(false);
                }}
                className="btn btn-outline"
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Course'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Access</th>
                <th>Instructors</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-empty">
                    <BookOpen size={32} />
                    <p>No courses found in this organization. Click 'New Course' to add one.</p>
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.course_uuid || course._id}>
                    <td>
                      <div className="course-cell-title">
                        <strong>{course.title}</strong>
                        <span className="course-slug">/{course.course_uuid.substring(0, 8)}...</span>
                      </div>
                      <p className="course-cell-desc">{course.description || 'No description provided.'}</p>
                    </td>
                    <td>
                      <span className={`badge ${course.published ? 'badge-success' : 'badge-neutral'}`}>
                        {course.published ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${course.public ? 'badge-info' : 'badge-warning'}`}>
                        {course.public ? 'PUBLIC' : 'PRIVATE'}
                      </span>
                    </td>
                    <td>
                      <div className="authors-list">
                        {course.authors?.map((a, idx) => (
                          <span key={a.user_id?._id || a.user_id || idx} className="author-tag" title={a.user_id?.email || 'Instructor'}>
                            {a.user_id?.email 
                              ? `${a.user_id.email.split('@')[0]} (${a.role})` 
                              : (a.role ? a.role.charAt(0).toUpperCase() + a.role.slice(1) : 'Instructor')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="btn-actions-group">
                        <button
                          onClick={() => handleTogglePublish(course)}
                          className="btn-action"
                          title={course.published ? 'Archive Course' : 'Publish Course'}
                        >
                          {course.published ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => navigate(`/org/${activeOrg.slug}/courses/${course.course_uuid}/curriculum`)}
                          className="btn-action"
                          title="Edit Curriculum / Syllabus"
                          style={{ color: 'var(--primary)' }}
                        >
                          <BookOpen size={16} />
                        </button>
                        <button
                          onClick={() => handleEditClick(course)}
                          className="btn-action"
                          title="Edit Course"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleCloneCourse(course.course_uuid)}
                          className="btn-action"
                          title="Clone Course"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course.course_uuid)}
                          className="btn-action btn-action-danger"
                          title="Delete Course"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
