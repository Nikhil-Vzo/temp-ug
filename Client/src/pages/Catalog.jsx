import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { BookOpen, Check, Award, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export default function Catalog() {
  const { activeOrg, currentUser } = useOutletContext();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [enrollingId, setEnrollingId] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (activeOrg) {
      fetchCourses();
    }
  }, [activeOrg]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      
      // Fetch both courses and current user enrollments in parallel
      const [coursesRes, enrollmentsRes] = await Promise.all([
        api.getCoursesByOrg(activeOrg.slug),
        api.getMyEnrollments().catch(err => {
          console.warn('Failed to fetch user enrollments:', err);
          return { data: { enrollments: [] } };
        })
      ]);

      // Students should only see published courses!
      const published = (coursesRes.data.courses || []).filter(c => c.published);
      setCourses(published);

      // Extract enrolled course IDs
      const enrolled = new Set(
        (enrollmentsRes.data.enrollments || []).map(e => e.course_id?._id || e.course_id)
      );
      setEnrolledIds(enrolled);
    } catch (err) {
      setError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (course) => {
    setEnrollingId(course._id);
    setError('');
    setSuccess('');

    try {
      await api.enrollCourse(course._id);
      setSuccess(`Successfully enrolled in "${course.title}"!`);
      setEnrolledIds(prev => new Set([...prev, course._id]));
    } catch (err) {
      setError(err.message || 'Failed to enroll in course');
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div className="catalog-container">
      <div className="content-header">
        <div>
          <h2>Course Catalog</h2>
          <p>Browse courses in {activeOrg?.name} and enroll to start learning</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="catalog-grid">
          {courses.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={48} />
              <h3>No courses available</h3>
              <p>There are no published courses in this organization at this time.</p>
            </div>
          ) : (
            courses.map((course) => {
              const isEnrolled = enrolledIds.has(course._id);

              return (
                <div key={course._id} className="catalog-card">
                  <div className="catalog-card-header">
                    <span className="badge badge-accent">Syllabus</span>
                    <span className="difficulty-badge">Beginner</span>
                  </div>

                  <div className="catalog-card-body">
                    <h3>{course.title}</h3>
                    <p>{course.description || 'No description available for this course yet.'}</p>
                  </div>

                  <div className="catalog-card-footer">
                    {isEnrolled ? (
                      <button
                        onClick={() => navigate(`/org/${activeOrg.slug}/courses/${course.course_uuid}/learn`)}
                        className="btn btn-success btn-block"
                      >
                        Start Learning
                        <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course)}
                        disabled={enrollingId === course._id}
                        className="btn btn-primary btn-block"
                      >
                        {enrollingId === course._id ? 'Enrolling...' : 'Enroll Now'}
                        <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
