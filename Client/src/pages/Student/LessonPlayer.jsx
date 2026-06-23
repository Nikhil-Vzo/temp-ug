import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle2, Circle, PlayCircle, BookOpen, 
  Video, FileText, ChevronRight, Award, Compass, HelpCircle, Loader 
} from 'lucide-react';
import ReactPlayer from 'react-player';
import { api } from '../../services/api';

export default function LessonPlayer() {
  const { slug, courseUuid } = useParams();
  const navigate = useNavigate();

  const [chapters, setChapters] = useState([]);
  const [progressRecords, setProgressRecords] = useState([]);
  const [courseProgress, setCourseProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selection
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeLessonDetails, setActiveLessonDetails] = useState(null);
  const [streamingUrl, setStreamingUrl] = useState('');
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Assignment states
  const [mySubmission, setMySubmission] = useState(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submittingAssignment, setSubmittingAssignment] = useState(false);

  // Quiz states
  const [quiz, setQuiz] = useState(null);
  const [quizSubmission, setQuizSubmission] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  useEffect(() => {
    loadCourseSyllabus();
  }, [courseUuid]);

  const loadCourseSyllabus = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Fetch full curriculum tree
      const syllabusRes = await api.getCourseChapters(courseUuid);
      const chaptersList = syllabusRes.data?.chapters || [];
      setChapters(chaptersList);

      // 2. Fetch student progress records
      const progressRecordsRes = await api.getUserCourseProgressRecords(courseUuid);
      const records = progressRecordsRes.data?.records || [];
      setProgressRecords(records);

      // 3. Fetch overall completion percentage
      const overallProgressRes = await api.getCourseProgress(courseUuid);
      setCourseProgress(overallProgressRes.data?.completionPercentage || 0);

      // Auto-select first lesson if none selected
      if (chaptersList.length > 0 && !activeLesson) {
        const firstChapter = chaptersList[0];
        if (firstChapter.modules?.length > 0) {
          const firstModule = firstChapter.modules[0];
          if (firstModule.activities?.length > 0) {
            handleSelectLesson(firstModule.activities[0]);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load course player.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLesson = async (lesson) => {
    setActiveLesson(lesson);
    setActiveLessonDetails(null);
    setStreamingUrl('');
    setLoadingMedia(true);
    setMySubmission(null);
    setSubmissionUrl('');
    setQuiz(null);
    setQuizSubmission(null);
    setSelectedAnswers({});
    setQuizFinished(false);
    setQuizResult(null);
    clearAlerts();

    try {
      // 1. Fetch specific lesson details
      const detailsRes = await api.getLesson(lesson._id);
      const lessonDetails = detailsRes.data?.lesson;
      setActiveLessonDetails(lessonDetails);

      // 2. Try to fetch streaming URL if it is a video
      if (lesson.activity_type === 'video') {
        const streamRes = await api.getStreamingUrl(lesson._id).catch(() => null);
        if (streamRes && streamRes.data) {
          setStreamingUrl(streamRes.data.streamingUrl);
        }
      }

      // 3. Load assignment details if assignment
      if (lesson.activity_type === 'assignment') {
        const configId = lessonDetails?.assignment_config?._id || lessonDetails?.assignment_config;
        if (configId) {
          const subRes = await api.getMySubmission(configId).catch(() => null);
          setMySubmission(subRes?.data?.submission || null);
        }
      }

      // 4. Load quiz details if quiz
      if (lesson.activity_type === 'quiz') {
        const quizRes = await api.getQuizByLesson(lesson._id).catch(() => null);
        const quizObj = quizRes?.data?.quiz;
        setQuiz(quizObj || null);
        if (quizObj) {
          const resultRes = await api.getQuizResult(quizObj._id).catch(() => null);
          setQuizResult(resultRes?.data?.result || null);
        }
      }

      // 5. Inform backend the student started this lesson
      await api.startLessonProgress(lesson._id).catch(() => null);
      
      // Refresh progress records list
      const progressRecordsRes = await api.getUserCourseProgressRecords(courseUuid);
      setProgressRecords(progressRecordsRes.data?.records || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleVideoProgress = async (state) => {
    if (!activeLesson) return;
    const completionPercentage = Math.round(state.played * 100);
    const lastPosition = Math.round(state.playedSeconds);

    // Call update progress endpoint (throttled conceptually, but direct here is fine)
    if (completionPercentage % 10 === 0) {
      await api.updateLessonProgress(activeLesson._id, completionPercentage, lastPosition).catch(() => null);
    }
  };

  const handleCompleteLesson = async () => {
    if (!activeLesson) return;
    setCompleting(true);
    try {
      await api.completeLessonProgress(activeLesson._id);
      
      // Reload progress states
      const progressRecordsRes = await api.getUserCourseProgressRecords(courseUuid);
      setProgressRecords(progressRecordsRes.data?.records || []);

      const overallProgressRes = await api.getCourseProgress(courseUuid);
      setCourseProgress(overallProgressRes.data?.completionPercentage || 0);

      // Find next lesson to auto-navigate
      navigateToNextLesson();
    } catch (err) {
      console.error(err);
    } finally {
      setCompleting(false);
    }
  };

  const navigateToNextLesson = () => {
    let foundCurrent = false;
    for (let c of chapters) {
      for (let m of c.modules || []) {
        for (let a of m.activities || []) {
          if (foundCurrent) {
            handleSelectLesson(a);
            return;
          }
          if (a._id === activeLesson._id) {
            foundCurrent = true;
          }
        }
      }
    }
  };

  const clearAlerts = () => {
    setError('');
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    const config = activeLessonDetails?.assignment_config;
    if (!config) return;
    const assignmentId = config._id || config;
    setSubmittingAssignment(true);
    try {
      const res = await api.submitAssignment(assignmentId, submissionUrl);
      setMySubmission(res.data?.submission);
      alert('Assignment submitted successfully!');
      await handleCompleteLesson();
    } catch (err) {
      alert(err.message || 'Failed to submit assignment');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!quiz) return;
    try {
      const startRes = await api.startQuiz(quiz._id);
      setQuizSubmission(startRes.data?.submission);
      setSelectedAnswers({});
      setQuizFinished(false);
    } catch (err) {
      alert(err.message || 'Failed to start quiz');
    }
  };

  const handleSelectAnswer = (qUuid, optIdx) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [qUuid]: optIdx
    });
  };

  const handleSubmitQuiz = async (e) => {
    e.preventDefault();
    if (!quiz || !quizSubmission) return;
    const answers = Object.entries(selectedAnswers).map(([questionUuid, selectedOptionIndex]) => ({
      questionUuid,
      selectedOptionIndex
    }));
    try {
      const submitRes = await api.submitQuiz(quiz._id, answers);
      const finishedSubmission = submitRes.data?.submission;
      setQuizSubmission(finishedSubmission);
      setQuizFinished(true);

      const resultRes = await api.getQuizResult(quiz._id).catch(() => null);
      setQuizResult(resultRes?.data?.result || null);

      if (finishedSubmission?.passed) {
        await handleCompleteLesson();
      }
    } catch (err) {
      alert(err.message || 'Failed to submit quiz');
    }
  };

  // Helper: check completion status of a lesson
  const getLessonStatus = (lessonId) => {
    const record = progressRecords.find(r => r.lesson_id === lessonId);
    if (!record) return 'not_started';
    return record.completed ? 'completed' : 'started';
  };

  if (loading) {
    return (
      <div className="player-loading-container">
        <div className="spinner"></div>
        <p>Loading course environment...</p>
      </div>
    );
  }

  return (
    <div className="player-container">
      {/* Sidebar Navigation */}
      <aside className="player-sidebar">
        <div className="sidebar-header">
          <Link to={`/org/${slug}/catalog`} className="back-link">
            <ArrowLeft size={16} /> Course Catalog
          </Link>
          <h3>Syllabus</h3>
          
          <div className="progress-section">
            <div className="progress-meta">
              <span>Overall Progress</span>
              <strong>{courseProgress}%</strong>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${courseProgress}%` }}></div>
            </div>
          </div>
        </div>

        <nav className="syllabus-tree">
          {chapters.map((chapter, cIdx) => (
            <div key={chapter._id} className="sidebar-chapter">
              <div className="chapter-label">
                <span>Chapter {cIdx + 1}</span>
                <h4>{chapter.title}</h4>
              </div>

              <div className="chapter-contents">
                {chapter.modules?.map((module, mIdx) => (
                  <div key={module._id} className="sidebar-module">
                    <span className="module-label">Module {module.title}</span>
                    
                    <div className="lessons-list">
                      {module.activities?.map((lesson) => {
                        const status = getLessonStatus(lesson._id);
                        const isCurrent = activeLesson?._id === lesson._id;

                        return (
                          <button
                            key={lesson._id}
                            onClick={() => handleSelectLesson(lesson)}
                            className={`lesson-nav-btn ${isCurrent ? 'active' : ''}`}
                          >
                            {status === 'completed' ? (
                              <CheckCircle2 size={16} className="status-completed" />
                            ) : status === 'started' ? (
                              <PlayCircle size={16} className="status-started" />
                            ) : (
                              <Circle size={16} className="status-locked" />
                            )}
                            
                            <span className="lesson-nav-title">{lesson.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Panel Content */}
      <main className="player-main">
        {activeLesson ? (
          <div className="lesson-viewport">
            <div className="viewport-header">
              <div className="title-row">
                <span className="badge badge-accent">{activeLesson.activity_type.toUpperCase()}</span>
                <h2>{activeLesson.title}</h2>
              </div>
            </div>

            <div className="viewport-content">
              {loadingMedia ? (
                <div className="spinner-container">
                  <div className="spinner"></div>
                  <p>Loading lesson media...</p>
                </div>
              ) : activeLesson.activity_type === 'video' ? (
                (() => {
                  const videoUrl = streamingUrl 
                    || activeLessonDetails?.blocks?.find(b => b.block_type === 'video')?.content?.fileKey
                    || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
                  const isDirectMp4 = videoUrl.endsWith('.mp4') || videoUrl.includes('googleapis.com') || videoUrl.includes('cloudinary');
                  return (
                    <div className="video-player-wrapper">
                      <div className="player-aspect-ratio">
                        {isDirectMp4 ? (
                          <video
                            src={videoUrl}
                            controls
                            autoPlay={false}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#000' }}
                            onPlay={() => api.startLessonProgress(activeLesson._id).catch(() => null)}
                            onTimeUpdate={(e) => {
                              const vid = e.target;
                              if (vid.duration) {
                                const pct = Math.round((vid.currentTime / vid.duration) * 100);
                                if (pct % 10 === 0) {
                                  api.updateLessonProgress(activeLesson._id, pct, Math.round(vid.currentTime)).catch(() => null);
                                }
                              }
                            }}
                            onEnded={handleCompleteLesson}
                          />
                        ) : (
                          <ReactPlayer
                            url={videoUrl}
                            controls={true}
                            width="100%"
                            height="100%"
                            style={{ position: 'absolute', top: 0, left: 0 }}
                            onStart={() => api.startLessonProgress(activeLesson._id).catch(() => null)}
                            onProgress={handleVideoProgress}
                            onEnded={handleCompleteLesson}
                            onError={(e) => console.error('ReactPlayer error:', e)}
                          />
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : activeLesson.activity_type === 'pdf' ? (
                (() => {
                  const pdfBlock = activeLessonDetails?.blocks?.find(b => b.block_type === 'pdf');
                  const rawPdfUrl = pdfBlock?.content?.fileKey;
                  const pdfUrl = rawPdfUrl && rawPdfUrl.startsWith('http')
                    ? rawPdfUrl
                    : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
                  // Use Google Docs Viewer as fallback for cross-origin PDFs
                  const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
                  return (
                    <div className="pdf-viewer-wrapper">
                      <h4>
                        <FileText size={24} style={{ color: 'var(--accent)' }} />
                        PDF Reading Material
                      </h4>
                      <div className="pdf-iframe-container">
                        <iframe
                          src={googleViewerUrl}
                          title="PDF Viewer"
                          allow="autoplay"
                        />
                      </div>
                      <div className="pdf-actions">
                        <a 
                          href={pdfUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-primary"
                        >
                          Open PDF in New Tab
                        </a>
                        <a 
                          href={pdfUrl} 
                          download
                          className="btn btn-outline"
                        >
                          Download PDF
                        </a>
                      </div>
                    </div>
                  );
                })()
              ) : activeLesson.activity_type === 'assignment' ? (
                <div className="document-player-card" style={{ padding: '24px', textAlign: 'left' }}>
                  <HelpCircle size={48} className="text-warning" style={{ marginBottom: '16px' }} />
                  <h3 style={{ marginBottom: '12px' }}>Assignment Task</h3>
                  {activeLessonDetails?.assignment_config ? (
                    <div>
                      <div className="assignment-instructions" style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '24px' }}>
                        <h4 style={{ color: 'var(--text-h)', marginBottom: '8px' }}>Instructions:</h4>
                        <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text)' }}>
                          {activeLessonDetails.assignment_config.instructions}
                        </p>
                      </div>

                      {mySubmission ? (
                        <div style={{ border: '1px solid var(--success-border)', background: 'var(--success-bg)', padding: '16px', borderRadius: '8px' }}>
                          <h4 style={{ color: 'var(--success)', marginBottom: '8px' }}>Submitted Successfully!</h4>
                          <p style={{ fontSize: '14px', marginBottom: '8px' }}>
                            <strong>Submission URL:</strong> <a href={mySubmission.submission_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>{mySubmission.submission_url}</a>
                          </p>
                          <p style={{ fontSize: '13px', color: 'var(--text)', opacity: 0.7 }}>
                            Submitted on: {new Date(mySubmission.submitted_at).toLocaleString()}
                          </p>
                          {mySubmission.graded_at ? (
                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--success-border)' }}>
                              <p><strong>Score:</strong> <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>{mySubmission.score}/100</span></p>
                              {mySubmission.remarks && <p><strong>Remarks:</strong> {mySubmission.remarks}</p>}
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--warning)' }}>Pending review/grading by instructor</span>
                          )}
                        </div>
                      ) : (
                        <form onSubmit={handleSubmitAssignment} style={{ marginTop: '16px' }}>
                          <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Submit your work (Google Doc / GitHub / Cloudinary Link)</label>
                            <input 
                              type="url" 
                              value={submissionUrl}
                              onChange={(e) => setSubmissionUrl(e.target.value)}
                              placeholder="https://github.com/... or https://docs.google.com/..."
                              style={{ width: '100%', padding: '10px', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '6px' }}
                              required
                            />
                          </div>
                          <button type="submit" className="btn btn-primary" disabled={submittingAssignment}>
                            {submittingAssignment ? 'Submitting...' : 'Submit Assignment'}
                          </button>
                        </form>
                      )}
                    </div>
                  ) : (
                    <div className="video-placeholder-card">
                      <HelpCircle size={48} />
                      <h4>No assignment configuration details found</h4>
                      <p>An instructor has not specified instructions for this assignment yet.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="document-player-card" style={{ padding: '24px', textAlign: 'left' }}>
                  <Award size={48} className="text-accent" style={{ marginBottom: '16px' }} />
                  <h3 style={{ marginBottom: '12px' }}>Interactive Quiz</h3>
                  {!quiz ? (
                    <div className="video-placeholder-card">
                      <Award size={48} />
                      <h4>No quiz configuration details found</h4>
                      <p>An instructor has not added questions to this quiz yet.</p>
                    </div>
                  ) : quizResult ? (
                    <div style={{ border: quizResult.passed ? '1px solid var(--success-border)' : '1px solid var(--error-border)', background: quizResult.passed ? 'var(--success-bg)' : 'var(--error-bg)', padding: '20px', borderRadius: '8px' }}>
                      <h4 style={{ color: quizResult.passed ? 'var(--success)' : 'var(--error)', marginBottom: '8px' }}>
                        {quizResult.passed ? 'Quiz Passed!' : 'Quiz Failed'}
                      </h4>
                      <p style={{ fontSize: '15px', marginBottom: '8px' }}>
                        Your Score: <strong>{quizResult.score}%</strong> (Passing score: {quiz?.passing_score || 70}%)
                      </p>
                      <p style={{ fontSize: '13px', color: 'var(--text)', opacity: 0.7, marginBottom: '16px' }}>
                        Attempted on: {new Date(quizResult.submittedAt || quizResult.submitted_at || Date.now()).toLocaleString()}
                      </p>
                      {!quizResult.passed && (
                        <button onClick={handleStartQuiz} className="btn btn-primary">
                          Retake Quiz
                        </button>
                      )}
                    </div>
                  ) : quizSubmission ? (
                    <form onSubmit={handleSubmitQuiz}>
                      <div className="quiz-questions-playback">
                        {(quiz.questions || []).map((q, qIdx) => (
                          <div key={q.question_uuid || qIdx} style={{ marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                            <p style={{ fontWeight: '500', marginBottom: '12px', fontSize: '15px' }}>
                              {qIdx + 1}. {q.text}
                            </p>
                            <div className="quiz-options-group" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                              {(q.options || []).map((opt, oIdx) => {
                                const isSelected = selectedAnswers[q.question_uuid || qIdx] === oIdx;
                                return (
                                  <button
                                    key={oIdx}
                                    type="button"
                                    onClick={() => handleSelectAnswer(q.question_uuid || qIdx, oIdx)}
                                    className={`btn btn-outline`}
                                    style={{
                                      textAlign: 'left',
                                      justifyContent: 'flex-start',
                                      background: isSelected ? 'var(--accent-bg)' : 'transparent',
                                      borderColor: isSelected ? 'var(--accent-border)' : 'var(--border)',
                                      color: isSelected ? 'var(--accent)' : 'var(--text)'
                                    }}
                                  >
                                    <span style={{ marginRight: '10px', opacity: 0.6 }}>({String.fromCharCode(65 + oIdx)})</span>
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={Object.keys(selectedAnswers).length < (quiz.questions || []).length}
                      >
                        Submit Answers
                      </button>
                    </form>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px' }}>
                      <p style={{ marginBottom: '16px' }}>
                        This quiz contains <strong>{(quiz.questions || []).length} questions</strong>. You need <strong>{quiz.passing_score || 70}%</strong> to pass.
                      </p>
                      <button onClick={handleStartQuiz} className="btn btn-primary">
                        Start Quiz Attempt
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Lesson Controls */}
              <div className="viewport-footer">
                <button
                  onClick={handleCompleteLesson}
                  disabled={completing || getLessonStatus(activeLesson._id) === 'completed'}
                  className="btn btn-success"
                >
                  {completing ? 'Completing...' : getLessonStatus(activeLesson._id) === 'completed' ? 'Completed' : 'Mark as Completed'}
                </button>
                
                <button onClick={navigateToNextLesson} className="btn btn-outline">
                  Next Lesson <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-viewport">
            <BookOpen size={64} />
            <h2>Select a lesson to begin learning</h2>
            <p>Choose any item from the left curriculum sidebar to view video lectures or reading slides.</p>
          </div>
        )}
      </main>
    </div>
  );
}
