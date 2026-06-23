import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit3, Trash2, Video, FileText, CheckCircle, 
  ArrowUp, ArrowDown, Upload, X, Film, Play, Loader, ShieldAlert 
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { api } from '../../services/api';

export default function CurriculumBuilder() {
  const { slug, courseUuid } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal / Form states
  const [modalType, setModalType] = useState(null); // 'chapter' | 'module' | 'lesson'
  const [modalAction, setModalAction] = useState('create'); // 'create' | 'edit'
  const [currentItem, setCurrentItem] = useState(null); // Item being edited/deleted or parent id
  const [formTitle, setFormTitle] = useState('');
  const [lessonType, setLessonType] = useState('video');
  const [submitting, setSubmitting] = useState(false);

  // Upload States
  const [uploadingLessonId, setUploadingLessonId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Assignment Modal States
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [activeAssignmentLesson, setActiveAssignmentLesson] = useState(null);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentInstructions, setAssignmentInstructions] = useState('');

  // Quiz Modal States
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [activeQuizLesson, setActiveQuizLesson] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizPassingScore, setQuizPassingScore] = useState(70);
  const [quizQuestions, setQuizQuestions] = useState([]);

  useEffect(() => {
    loadCurriculum();
  }, [courseUuid]);

  const loadCurriculum = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch course details first (to get the title)
      const courseRes = await api.getCourse(courseUuid).catch(() => null);
      if (courseRes && courseRes.data) {
        setCourse(courseRes.data.course);
      }

      // Fetch curriculum tree
      const res = await api.getCourseChapters(courseUuid);
      setChapters(res.data?.chapters || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load curriculum. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const clearAlerts = () => {
    setError('');
    setSuccess('');
  };

  const handleOpenModal = (type, action, item = null) => {
    setModalType(type);
    setModalAction(action);
    setCurrentItem(item);
    if (action === 'edit' && item) {
      setFormTitle(item.title);
      if (type === 'lesson') {
        setLessonType(item.activity_type || 'video');
      }
    } else {
      setFormTitle('');
      setLessonType('video');
    }
    clearAlerts();
  };

  const handleCloseModal = () => {
    setModalType(null);
    setCurrentItem(null);
    setFormTitle('');
    setLessonType('video');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    setSubmitting(true);
    clearAlerts();

    try {
      if (modalType === 'chapter') {
        if (modalAction === 'create') {
          await api.createChapter(courseUuid, formTitle, '');
          setSuccess('Chapter created successfully!');
        } else {
          await api.updateChapter(currentItem.chapter_uuid, { title: formTitle });
          setSuccess('Chapter updated successfully!');
        }
      } else if (modalType === 'module') {
        if (modalAction === 'create') {
          // currentItem is chapterId (Mongoose ObjectId)
          await api.createModule(currentItem, formTitle);
          setSuccess('Module created successfully!');
        } else {
          await api.updateModule(currentItem._id, formTitle);
          setSuccess('Module updated successfully!');
        }
      } else if (modalType === 'lesson') {
        if (modalAction === 'create') {
          // currentItem is moduleId (Mongoose ObjectId)
          await api.createLesson(currentItem, formTitle, lessonType);
          setSuccess('Lesson created successfully!');
        } else {
          await api.updateLesson(currentItem._id, { title: formTitle, lessonType });
          setSuccess('Lesson updated successfully!');
        }
      }
      handleCloseModal();
      await loadCurriculum();
    } catch (err) {
      setError(err.message || 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (type, item) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    clearAlerts();

    try {
      if (type === 'chapter') {
        await api.deleteChapter(item.chapter_uuid);
      } else if (type === 'module') {
        await api.deleteModule(item._id);
      } else if (type === 'lesson') {
        await api.deleteLesson(item._id);
      }
      setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully.`);
      await loadCurriculum();
    } catch (err) {
      setError(err.message || `Failed to delete ${type}`);
    }
  };

  // Up/Down reordering logic
  const handleReorder = async (direction, index, chapterIndex = null, moduleIndex = null) => {
    clearAlerts();
    try {
      let newChapters = JSON.parse(JSON.stringify(chapters));

      if (chapterIndex === null) {
        // Reordering Chapters
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newChapters.length) return;

        const temp = newChapters[index];
        newChapters[index] = newChapters[targetIndex];
        newChapters[targetIndex] = temp;
      } else if (moduleIndex === null) {
        // Reordering Modules inside a Chapter
        const ch = newChapters[chapterIndex];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= (ch.modules || []).length) return;

        const temp = ch.modules[index];
        ch.modules[index] = ch.modules[targetIndex];
        ch.modules[targetIndex] = temp;
      } else {
        // Reordering Lessons/Activities inside a Module
        const mod = newChapters[chapterIndex].modules[moduleIndex];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= (mod.activities || []).length) return;

        const temp = mod.activities[index];
        mod.activities[index] = mod.activities[targetIndex];
        mod.activities[targetIndex] = temp;
      }

      // Prepare payload for backend
      // newChapterOrder is array of chapter IDs
      const newChapterOrder = newChapters.map(c => c._id);
      
      // chapterActivityUpdates is module orders for each chapter
      const chapterActivityUpdates = newChapters.map(c => ({
        chapterId: c._id,
        newActivities: (c.modules || []).filter(Boolean).map(m => m._id)
      }));

      // moduleActivityUpdates is lesson orders for each module
      const moduleActivityUpdates = [];
      newChapters.forEach(c => {
        (c.modules || []).filter(Boolean).forEach(m => {
          moduleActivityUpdates.push({
            moduleId: m._id,
            newLessons: (m.activities || []).filter(Boolean).map(a => a._id)
          });
        });
      });

      await api.reorderChapters(courseUuid, {
        newChapterOrder,
        chapterActivityUpdates,
        moduleActivityUpdates
      });

      setChapters(newChapters);
      setSuccess('Curriculum order updated!');
    } catch (err) {
      console.error(err);
      setError('Failed to update curriculum order.');
    }
  };

  // Video Dropzone File Handler
  const VideoUploadComponent = ({ lesson }) => {
    const onDrop = async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploadingLessonId(lesson._id);
      setUploadProgress(0);
      clearAlerts();

      try {
        // 1. Get signed signature / credentials from server
        const uploadConfigRes = await api.generateUploadUrl(file.name);
        const uploadConfig = uploadConfigRes.data;

        // 2. Upload file directly to Cloudinary (or simulate mock S3)
        const fileUrl = await api.cloudinaryUpload(file, uploadConfig, (progressPercent) => {
          setUploadProgress(progressPercent);
        });

        // 3. Attach fileUrl to lesson in backend database
        await api.attachVideo(lesson._id, fileUrl);

        setSuccess(`Video attached to lesson "${lesson.title}" successfully!`);
        await loadCurriculum();
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to upload video');
      } finally {
        setUploadingLessonId(null);
        setUploadProgress(0);
      }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: { 'video/*': [] },
      multiple: false
    });

    const isUploading = uploadingLessonId === lesson._id;
    const attachedVideoBlock = lesson.blocks?.find(b => b.block_type === 'video');

    return (
      <div className="video-upload-box">
        {isUploading ? (
          <div className="upload-progress-container">
            <Loader className="spinner" size={20} />
            <span>Uploading Video ({uploadProgress}%)</span>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        ) : (
          <div className="video-status-row">
            {attachedVideoBlock ? (
              <div className="video-attached-badge">
                <Film size={14} />
                <span className="video-name" title={attachedVideoBlock.content?.fileKey}>
                  Video Attached
                </span>
              </div>
            ) : (
              <span className="no-video-label">No Video Attached</span>
            )}
            
            <div {...getRootProps()} className={`dropzone-trigger ${isDragActive ? 'active' : ''}`}>
              <input {...getInputProps()} />
              <Upload size={14} />
              <span>{attachedVideoBlock ? 'Replace' : 'Upload Video'}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // PDF Dropzone File Handler
  const PdfUploadComponent = ({ lesson }) => {
    const onDrop = async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploadingLessonId(lesson._id);
      setUploadProgress(0);
      clearAlerts();

      try {
        // 1. Get signed signature / credentials from server
        const uploadConfigRes = await api.generateUploadUrl(file.name);
        const uploadConfig = uploadConfigRes.data;

        // 2. Upload file directly to Cloudinary (or simulate mock S3)
        const fileUrl = await api.cloudinaryUpload(file, uploadConfig, (progressPercent) => {
          setUploadProgress(progressPercent);
        });

        // 3. Attach fileUrl to lesson in backend database
        await api.attachPdf(lesson._id, fileUrl);

        setSuccess(`PDF attached to lesson "${lesson.title}" successfully!`);
        await loadCurriculum();
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to upload PDF');
      } finally {
        setUploadingLessonId(null);
        setUploadProgress(0);
      }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: { 'application/pdf': [] },
      multiple: false
    });

    const isUploading = uploadingLessonId === lesson._id;
    const attachedPdfBlock = lesson.blocks?.find(b => b.block_type === 'pdf');

    return (
      <div className="video-upload-box">
        {isUploading ? (
          <div className="upload-progress-container">
            <Loader className="spinner" size={20} />
            <span>Uploading PDF ({uploadProgress}%)</span>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        ) : (
          <div className="video-status-row">
            {attachedPdfBlock ? (
              <div className="video-attached-badge" style={{ color: 'var(--success)' }}>
                <FileText size={14} />
                <span className="video-name" title={attachedPdfBlock.content?.fileKey}>
                  PDF Attached
                </span>
              </div>
            ) : (
              <span className="no-video-label" style={{ color: 'var(--warning)' }}>No PDF Attached</span>
            )}
            
            <div {...getRootProps()} className={`dropzone-trigger ${isDragActive ? 'active' : ''}`}>
              <input {...getInputProps()} />
              <Upload size={14} />
              <span>{attachedPdfBlock ? 'Replace' : 'Upload PDF'}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Open Assignment Config Handler
  const handleOpenAssignmentConfig = (lesson) => {
    setActiveAssignmentLesson(lesson);
    const config = lesson.assignment_config;
    setAssignmentTitle(config?.title || lesson.title || '');
    setAssignmentInstructions(config?.instructions || '');
    setShowAssignmentModal(true);
    clearAlerts();
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!activeAssignmentLesson) return;
    setSubmitting(true);
    clearAlerts();
    try {
      const config = activeAssignmentLesson.assignment_config;
      if (config && config._id) {
        await api.updateAssignment(config._id, assignmentTitle, assignmentInstructions);
        setSuccess('Assignment updated successfully!');
      } else {
        await api.createAssignment(activeAssignmentLesson._id, assignmentTitle, assignmentInstructions);
        setSuccess('Assignment created successfully!');
      }
      setShowAssignmentModal(false);
      await loadCurriculum();
    } catch (err) {
      setError(err.message || 'Failed to save assignment configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Quiz Config Handler
  const handleOpenQuizConfig = async (lesson) => {
    setActiveQuizLesson(lesson);
    clearAlerts();
    setLoading(true);
    try {
      const res = await api.getQuizByLesson(lesson._id);
      let quiz = res.data?.quiz;
      if (!quiz) {
        const createRes = await api.createQuiz(lesson._id, lesson.title, 70);
        quiz = createRes.data?.quiz;
      }
      const adminRes = await api.getQuizAdmin(quiz._id);
      const fullQuiz = adminRes.data?.quiz;
      setActiveQuiz(fullQuiz);
      setQuizPassingScore(fullQuiz?.passing_score || 70);
      setQuizQuestions(fullQuiz?.questions || []);
      setShowQuizModal(true);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load quiz config');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setQuizQuestions([
      ...quizQuestions,
      {
        text: '',
        options: ['', '', '', ''],
        correct_option_index: 0
      }
    ]);
  };

  const handleUpdateQuestion = (qIdx, field, value) => {
    const updated = [...quizQuestions];
    updated[qIdx] = { ...updated[qIdx], [field]: value };
    setQuizQuestions(updated);
  };

  const handleUpdateOption = (qIdx, optIdx, value) => {
    const updated = [...quizQuestions];
    const opts = [...updated[qIdx].options];
    opts[optIdx] = value;
    updated[qIdx] = { ...updated[qIdx], options: opts };
    setQuizQuestions(updated);
  };

  const handleDeleteQuestion = (qIdx) => {
    const updated = quizQuestions.filter((_, idx) => idx !== qIdx);
    setQuizQuestions(updated);
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    if (!activeQuiz) return;
    setSubmitting(true);
    clearAlerts();
    try {
      await api.updateQuiz(activeQuiz._id, activeQuiz.title, quizPassingScore, quizQuestions);
      setSuccess('Quiz updated successfully!');
      setShowQuizModal(false);
      await loadCurriculum();
    } catch (err) {
      setError(err.message || 'Failed to save quiz configurations.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="curriculum-container">
      {/* Header */}
      <div className="content-header">
        <div className="header-meta">
          <Link to={`/org/${slug}/courses`} className="back-link">
            <ArrowLeft size={18} /> Back to Courses
          </Link>
          <h2>Curriculum Builder</h2>
          {course && <p className="course-name-subtitle">Course: <strong>{course.title}</strong></p>}
        </div>
        <button onClick={() => handleOpenModal('chapter', 'create')} className="btn btn-primary">
          <Plus size={16} /> New Chapter
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Loading state */}
      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Loading curriculum structure...</p>
        </div>
      ) : (
        <div className="curriculum-tree">
          {chapters.length === 0 ? (
            <div className="empty-state">
              <ShieldAlert size={48} />
              <h3>Curriculum is empty</h3>
              <p>Get started by creating a Chapter and adding syllabus modules inside it.</p>
              <button onClick={() => handleOpenModal('chapter', 'create')} className="btn btn-outline">
                Add First Chapter
              </button>
            </div>
          ) : (
            chapters.filter(Boolean).map((chapter, cIdx) => (
              <div key={chapter._id} className="chapter-card">
                {/* Chapter Header */}
                <div className="chapter-header">
                  <div className="chapter-title-group">
                    <span className="index-label">Chapter {cIdx + 1}</span>
                    <h4>{chapter.title}</h4>
                  </div>
                  
                  <div className="actions-group">
                    <button 
                      onClick={() => handleReorder('up', cIdx)} 
                      disabled={cIdx === 0} 
                      className="btn-icon" 
                      title="Move Chapter Up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button 
                      onClick={() => handleReorder('down', cIdx)} 
                      disabled={cIdx === chapters.length - 1} 
                      className="btn-icon" 
                      title="Move Chapter Down"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button 
                      onClick={() => handleOpenModal('chapter', 'edit', chapter)} 
                      className="btn-icon text-blue" 
                      title="Rename Chapter"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteItem('chapter', chapter)} 
                      className="btn-icon text-red" 
                      title="Delete Chapter"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleOpenModal('module', 'create', chapter._id)} 
                      className="btn btn-xs btn-outline"
                    >
                      <Plus size={12} /> Add Module
                    </button>
                  </div>
                </div>

                {/* Modules inside Chapter */}
                <div className="chapter-body">
                  {(!chapter.modules || chapter.modules.length === 0) ? (
                    <p className="empty-subtext">No modules inside this chapter. Add a module to start organizing lessons.</p>
                  ) : (
                    chapter.modules.filter(Boolean).map((module, mIdx) => (
                      <div key={module._id} className="module-item">
                        {/* Module Header */}
                        <div className="module-header">
                          <div className="module-title-group">
                            <span className="index-sublabel">Module {cIdx + 1}.{mIdx + 1}</span>
                            <h5>{module.title}</h5>
                          </div>

                          <div className="actions-group">
                            <button 
                              onClick={() => handleReorder('up', mIdx, cIdx)} 
                              disabled={mIdx === 0} 
                              className="btn-icon"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button 
                              onClick={() => handleReorder('down', mIdx, cIdx)} 
                              disabled={mIdx === (chapter.modules || []).filter(Boolean).length - 1} 
                              className="btn-icon"
                            >
                              <ArrowDown size={12} />
                            </button>
                            <button 
                              onClick={() => handleOpenModal('module', 'edit', module)} 
                              className="btn-icon text-blue"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button 
                              onClick={() => handleDeleteItem('module', module)} 
                              className="btn-icon text-red"
                            >
                              <Trash2 size={12} />
                            </button>
                            <button 
                              onClick={() => handleOpenModal('lesson', 'create', module._id)} 
                              className="btn btn-xs btn-primary-outline"
                            >
                              <Plus size={12} /> Lesson
                            </button>
                          </div>
                        </div>

                        {/* Lessons inside Module */}
                        <div className="module-body">
                          {(!module.activities || module.activities.length === 0) ? (
                            <p className="empty-subtext">No lessons in this module.</p>
                          ) : (
                            module.activities.filter(Boolean).map((lesson, lIdx) => (
                              <div key={lesson._id} className="lesson-item">
                                <div className="lesson-info">
                                  <div className="lesson-meta-header">
                                    <span className="index-lesson-label">{cIdx + 1}.{mIdx + 1}.{lIdx + 1}</span>
                                    {lesson.activity_type === 'video' ? (
                                      <Video size={14} className="text-blue" />
                                    ) : (
                                      <FileText size={14} className="text-purple" />
                                    )}
                                    <span className="lesson-title">{lesson.title}</span>
                                    <span className={`badge-pill badge-pill-${lesson.activity_type}`}>
                                      {lesson.activity_type?.toUpperCase()}
                                    </span>
                                  </div>

                                  {/* Cloudinary Video Upload Trigger */}
                                  {lesson.activity_type === 'video' && (
                                    <VideoUploadComponent lesson={lesson} />
                                  )}

                                  {/* Cloudinary PDF Upload Trigger */}
                                  {lesson.activity_type === 'pdf' && (
                                    <PdfUploadComponent lesson={lesson} />
                                  )}

                                  {/* Assignment Config Trigger */}
                                  {lesson.activity_type === 'assignment' && (
                                    <div style={{ marginTop: '8px', paddingLeft: '28px' }}>
                                      <button 
                                        type="button"
                                        onClick={() => handleOpenAssignmentConfig(lesson)}
                                        className="btn btn-xs btn-outline"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                      >
                                        <Edit3 size={12} />
                                        {lesson.assignment_config ? 'Configure Assignment' : 'Create Assignment Config'}
                                      </button>
                                    </div>
                                  )}

                                  {/* Quiz Config Trigger */}
                                  {lesson.activity_type === 'quiz' && (
                                    <div style={{ marginTop: '8px', paddingLeft: '28px' }}>
                                      <button 
                                        type="button"
                                        onClick={() => handleOpenQuizConfig(lesson)}
                                        className="btn btn-xs btn-outline"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                      >
                                        <Plus size={12} />
                                        Build Quiz / Questions
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <div className="actions-group-inline">
                                  <button 
                                    onClick={() => handleReorder('up', lIdx, cIdx, mIdx)} 
                                    disabled={lIdx === 0} 
                                    className="btn-icon btn-icon-sm"
                                  >
                                    <ArrowUp size={11} />
                                  </button>
                                  <button 
                                    onClick={() => handleReorder('down', lIdx, cIdx, mIdx)} 
                                    disabled={lIdx === (module.activities || []).filter(Boolean).length - 1} 
                                    className="btn-icon btn-icon-sm"
                                  >
                                    <ArrowDown size={11} />
                                  </button>
                                  <button 
                                    onClick={() => handleOpenModal('lesson', 'edit', lesson)} 
                                    className="btn-icon btn-icon-sm text-blue"
                                  >
                                    <Edit3 size={11} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteItem('lesson', lesson)} 
                                    className="btn-icon btn-icon-sm text-red"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal for Forms */}
      {modalType && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {modalAction === 'create' ? 'Create' : 'Edit'}{' '}
                {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
              </h3>
              <button onClick={handleCloseModal} className="btn-close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input 
                  type="text" 
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={`Enter ${modalType} title...`}
                  required
                  autoFocus
                />
              </div>

              {modalType === 'lesson' && (
                <div className="form-group">
                  <label>Lesson Type</label>
                  <select 
                    value={lessonType} 
                    onChange={(e) => setLessonType(e.target.value)}
                  >
                    <option value="video">Video Lecture</option>
                    <option value="pdf">PDF Document</option>
                    <option value="assignment">Assignment Task</option>
                    <option value="quiz">Interactive Quiz</option>
                  </select>
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={handleCloseModal} className="btn btn-outline" disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Assignment Config */}
      {showAssignmentModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Configure Assignment</h3>
              <button onClick={() => setShowAssignmentModal(false)} className="btn-close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignmentSubmit}>
              <div className="form-group">
                <label>Assignment Title</label>
                <input 
                  type="text" 
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
                  placeholder="Enter assignment title..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Submission Instructions / Task details</label>
                <textarea 
                  value={assignmentInstructions}
                  onChange={(e) => setAssignmentInstructions(e.target.value)}
                  placeholder="Type what students need to submit and the requirements..."
                  rows={6}
                  style={{ width: '100%', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '4px', padding: '8px' }}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowAssignmentModal(false)} className="btn btn-outline" disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Quiz Builder */}
      {showQuizModal && activeQuiz && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>Quiz Builder: {activeQuiz.title}</h3>
              <button onClick={() => setShowQuizModal(false)} className="btn-close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuizSubmit}>
              <div className="form-group">
                <label>Passing Score (%)</label>
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  value={quizPassingScore}
                  onChange={(e) => setQuizPassingScore(Number(e.target.value))}
                  placeholder="e.g. 70"
                  required
                />
              </div>

              <div className="quiz-questions-section" style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4>Questions ({quizQuestions.length})</h4>
                  <button type="button" onClick={handleAddQuestion} className="btn btn-xs btn-primary">
                    <Plus size={12} /> Add Question
                  </button>
                </div>

                {quizQuestions.length === 0 ? (
                  <p className="empty-subtext" style={{ textAlign: 'center', padding: '20px' }}>No questions added yet. Click "Add Question" to start building your quiz.</p>
                ) : (
                  quizQuestions.map((question, qIdx) => (
                    <div key={qIdx} className="quiz-question-builder-card" style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '16px', marginBottom: '16px', background: 'rgba(255, 255, 255, 0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <strong style={{ fontSize: '14px' }}>Question {qIdx + 1}</strong>
                        <button type="button" onClick={() => handleDeleteQuestion(qIdx)} className="btn-icon text-red" title="Delete Question">
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="form-group" style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '12px' }}>Question Text</label>
                        <input 
                          type="text" 
                          value={question.text || ''}
                          onChange={(e) => handleUpdateQuestion(qIdx, 'text', e.target.value)}
                          placeholder="Type the question..."
                          required
                        />
                      </div>

                      <div className="options-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        {(question.options || []).map((opt, oIdx) => (
                          <div key={oIdx} className="option-input-group" style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>Option {oIdx + 1}</label>
                            <input 
                              type="text" 
                              value={opt || ''}
                              onChange={(e) => handleUpdateOption(qIdx, oIdx, e.target.value)}
                              placeholder={`Option ${oIdx + 1}`}
                              required
                            />
                          </div>
                        ))}
                      </div>

                      <div className="form-group" style={{ marginBottom: '0' }}>
                        <label style={{ fontSize: '12px' }}>Correct Option</label>
                        <select 
                          value={question.correct_option_index} 
                          onChange={(e) => handleUpdateQuestion(qIdx, 'correct_option_index', Number(e.target.value))}
                          style={{ width: '100%', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '4px', padding: '6px' }}
                        >
                          <option value={0}>Option 1</option>
                          <option value={1}>Option 2</option>
                          <option value={2}>Option 3</option>
                          <option value={3}>Option 4</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="form-actions" style={{ marginTop: '20px' }}>
                <button type="button" onClick={() => setShowQuizModal(false)} className="btn btn-outline" disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting || quizQuestions.length === 0}>
                  {submitting ? 'Saving...' : 'Save Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
