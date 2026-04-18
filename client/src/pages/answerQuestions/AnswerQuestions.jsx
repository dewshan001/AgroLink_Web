import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { Context } from "../../context/Context";
import ConfirmModal from "../../components/admin/ConfirmModal";
import { useToast } from "../../components/admin/Toast";
import "./answerQuestions.css";

const STATUSES = ['Pending', 'Answered', 'Rejected', 'All'];
const CATEGORIES = [
  'All', 'General', 'Organic Farming', 'Inorganic Farming',
  'Crop Diseases', 'Pest Management', 'Soil Management',
  'Weather & Climate', 'Crop Growth', 'Fertilizer Management'
];

export default function AnswerQuestions() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQA, setNewQA] = useState({ category: "", question: "", answer: "" });
  const { user } = useContext(Context);

  const displayName =
    user?.username?.trim() || user?.name?.trim() || user?.email?.trim() || "Guest";

  const [activeStatus, setActiveStatus] = useState('Pending');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(false);

  const [editingQId, setEditingQId] = useState(null);
  const [editFormData, setEditFormData] = useState({ question: "", category: "" });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast, ToastContainer } = useToast();

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      let url = "/questions?limit=50";
      if (activeStatus !== 'All') url += `&status=${activeStatus}`;
      if (activeCategory !== 'All') url += `&category=${activeCategory}`;

      const res = await axios.get(url);
      setQuestions(res.data);
    } catch (err) {
      console.error("Failed to fetch questions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [activeStatus, activeCategory]);

  const handleAnswerChange = (qId, value) => {
    setAnswers({ ...answers, [qId]: value });
  };

  const handleAnswerSubmit = async (e, qId) => {
    e.preventDefault();
    const answerContent = answers[qId]?.trim();
    if (!answerContent) return;

    try {
      await axios.put(`/questions/${qId}/answer`, {
        username: displayName,
        answer: answerContent,
        isAccepted: true
      });

      // Update question status locally to instantly reflect the change
      setQuestions(questions.map(q =>
        q._id === qId
          ? { ...q, status: "Answered", answers: [...q.answers, { username: displayName, answer: answerContent, isAccepted: true, createdAt: new Date() }] }
          : q
      ));
      setAnswers({ ...answers, [qId]: "" });

    } catch (err) {
      console.error("Failed to submit answer", err);
      alert("Error submitting answer. Please try again.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setActionLoading(true);
      await axios.delete(`/questions/${deleteTarget._id}`);
      setQuestions(questions.filter((q) => q._id !== deleteTarget._id));
      toast.success("Question deleted successfully");
    } catch (err) {
      console.error("Failed to delete question", err);
      toast.error("Error deleting the question. Please try again.");
    } finally {
      setActionLoading(false);
      setDeleteTarget(null);
    }
  };

  const handleCustomQASubmit = async (e) => {
    e.preventDefault();
    if (!newQA.question.trim() || !newQA.answer.trim()) return;

    try {
      await axios.post("/questions/training-pair", {
        username: displayName,
        question: newQA.question,
        answer: newQA.answer,
        category: newQA.category || "General",
      });

      alert("Training pair added successfully!");
      setNewQA({ category: "", question: "", answer: "" });
      setShowAddForm(false);

      // Refresh list to show the new custom QA
      fetchQuestions();
    } catch (err) {
      console.error("Failed to submit custom Q&A", err);
      alert("Error submitting custom Q&A. Please try again.");
    }
  };

  const startEditing = (q) => {
    setEditingQId(q._id);
    setEditFormData({ question: q.question, category: q.category || "General" });
  };

  const cancelEditing = () => {
    setEditingQId(null);
    setEditFormData({ question: "", category: "" });
  };

  const handleEditSubmit = async (e, qId) => {
    e.preventDefault();
    if (!editFormData.question.trim()) return;

    try {
      await axios.put(`/questions/${qId}`, {
        question: editFormData.question,
        category: editFormData.category
      });
      setQuestions(questions.map(q => q._id === qId ? { ...q, question: editFormData.question, category: editFormData.category } : q));
      cancelEditing();
    } catch (err) {
      console.error("Failed to update question", err);
      alert("Error updating question.");
    }
  };

  return (
    <div className="answerQuestions">
      <ToastContainer />
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Question"
        message={deleteTarget ? "Are you sure you want to permanently delete this question? This action cannot be undone." : ""}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { if (!actionLoading) setDeleteTarget(null); }}
      />
      {/* Header */}
      <div className="answerQuestionsHeader">
        <div className="aqHeaderMain">
          <h1 className="answerQuestionsTitle">Answer Community Questions</h1>
          <p className="answerQuestionsSubtitle">Help farmers by providing expert answers to questions our AI couldn't resolve, and manage the knowledge base.</p>
        </div>
        <button className="aqToggleAddBtn" onClick={() => setShowAddForm(!showAddForm)}>
          <i className={`fas fa-${showAddForm ? 'times' : 'plus'}`}></i> {showAddForm ? 'Cancel' : 'Add Training Q&A'}
        </button>
      </div>

      {/* Custom Form Section */}
      {showAddForm && (
        <div className="aqCustomFormContainer">
          <h2 className="aqCustomFormTitle">Add Custom Q&A Pair</h2>
          <form className="aqCustomForm" onSubmit={handleCustomQASubmit}>
            <div className="aqInputGroup">
              <label>Category (Optional):</label>
              <select
                value={newQA.category}
                onChange={(e) => setNewQA({ ...newQA, category: e.target.value })}
                className="aqSelectInput"
              >
                {CATEGORIES.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="aqInputGroup">
              <label>Question:</label>
              <textarea
                className="aqInput"
                placeholder="What is the question?"
                value={newQA.question}
                onChange={(e) => setNewQA({ ...newQA, question: e.target.value })}
                required
              ></textarea>
            </div>
            <div className="aqInputGroup">
              <label>Expert Answer:</label>
              <textarea
                className="aqInput aqAnswerArea"
                placeholder="Provide a detailed expert answer..."
                value={newQA.answer}
                onChange={(e) => setNewQA({ ...newQA, answer: e.target.value })}
                required
              ></textarea>
            </div>
            <button className="aqSubmit" type="submit" disabled={!newQA.question.trim() || !newQA.answer.trim()}>
              <i className="fas fa-save"></i> Save Training Pair
            </button>
          </form>
        </div>
      )}

      {/* Filter Bar */}
      <div style={{
        marginTop: 20, marginBottom: 20, padding: 16, borderRadius: 16,
        background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16
      }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setActiveStatus(s)}
              style={{
                padding: '6px 16px', borderRadius: 20, border: '1px solid',
                fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
                background: activeStatus === s ? 'var(--emerald-600)' : 'transparent',
                color: activeStatus === s ? '#fff' : 'var(--slate-500)',
                borderColor: activeStatus === s ? 'var(--emerald-600)' : 'var(--glass-border)',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Category Filter:
          </label>
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            style={{
              padding: '6px 12px', borderRadius: 10, border: '1px solid var(--glass-border)',
              background: 'var(--bg-surface)', color: 'var(--slate-700)',
              fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none'
            }}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--slate-500)', fontFamily: 'var(--font-body)' }}>
          Loading questions...
        </div>
      ) : questions.length === 0 ? (
        <div className="noQuestions" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
          <i className="fas fa-check-circle noQuestionsIcon"></i>
          <h2 className="noQuestionsText">Nothing to show!</h2>
          <p className="noQuestionsSubtext">There are no questions matching those filters.</p>
        </div>
      ) : (
        <div className="aqList">
          {questions.map((q) => (
            <div className="aqItem" key={q._id}>
              <div className="aqHeaderInfo">
                <div className="aqUserInfo">
                  <div className="aqAvatar">
                    {q.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="aqUserDetails">
                    <span className="aqUser">{q.username}</span>
                    <span className="aqDate">{new Date(q.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="aqBadges" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="aqCategory">{q.category || "General"}</span>
                  <span style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-display)',
                    background: q.status === 'Answered' ? 'var(--status-green-bg)' : (q.status === 'Pending' ? 'var(--status-yellow-bg)' : 'var(--status-gray-bg)'),
                    color: q.status === 'Answered' ? 'var(--status-green-txt)' : (q.status === 'Pending' ? 'var(--status-yellow-txt)' : 'var(--status-gray-txt)'),
                  }}>
                    {q.status}
                  </span>
                  {user && (user.isAdmin || user.role === 'expert') && (
                    <>
                      <button onClick={() => startEditing(q)} title="Edit Question" style={{
                        padding: 4, borderRadius: 6, border: 'none', background: 'transparent',
                        color: 'var(--slate-400)', cursor: 'pointer', transition: 'all 0.2s', marginRight: 4
                      }} onMouseEnter={e => e.currentTarget.style.color = 'var(--emerald-600)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--slate-400)'}>
                        <i className="fas fa-edit"></i>
                      </button>
                      <button onClick={() => setDeleteTarget(q)} title="Delete Question" style={{
                        padding: 4, borderRadius: 6, border: 'none', background: 'transparent',
                        color: 'var(--slate-400)', cursor: 'pointer', transition: 'all 0.2s'
                      }} onMouseEnter={e => e.currentTarget.style.color = 'var(--status-red-txt)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--slate-400)'}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="aqQuestionBody">
                {editingQId === q._id ? (
                  <form onSubmit={(e) => handleEditSubmit(e, q._id)} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <select
                      value={editFormData.category}
                      onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                      className="aqSelectInput"
                      style={{ padding: 8, borderRadius: 8, border: '1px solid var(--glass-border)', outline: 'none' }}
                    >
                      {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <textarea
                      value={editFormData.question}
                      onChange={(e) => setEditFormData({ ...editFormData, question: e.target.value })}
                      className="aqInput"
                      style={{ minHeight: 80 }}
                      required
                    ></textarea>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                      <button type="button" onClick={cancelEditing} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: 'var(--slate-200)', color: 'var(--slate-700)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                      <button type="submit" style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: 'var(--emerald-600)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Save Changes</button>
                    </div>
                  </form>
                ) : (
                  <p className="aqQuestion">{q.question}</p>
                )}
              </div>

              {q.status === 'Pending' ? (
                <form className="aqForm" onSubmit={(e) => handleAnswerSubmit(e, q._id)}>
                  <label className="aqFormLabel">
                    <i className="fas fa-pen"></i> Provide your expert answer:
                  </label>
                  <div className="aqInputWrapper">
                    <textarea
                      className="aqInput"
                      placeholder="Type a detailed and helpful answer..."
                      value={answers[q._id] || ""}
                      onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                      required
                    ></textarea>
                  </div>
                  <div className="aqActionRow">
                    <button className="aqSubmit" type="submit" disabled={!answers[q._id]?.trim()}>
                      <i className="fas fa-paper-plane"></i> Submit Answer
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ marginTop: 16, padding: 16, background: 'var(--mint-100)', borderRadius: 12, border: '1px solid var(--status-green-border)' }}>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--emerald-700)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="fas fa-check-circle"></i> Accepted Expert Answer
                  </h4>
                  {q.answers && q.answers.filter(a => a.isAccepted).map((ans, i) => (
                    <div key={i} style={{ marginBottom: i < q.answers.length - 1 ? 12 : 0 }}>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate-800)', lineHeight: 1.6 }}>{ans.answer}</p>
                      <span style={{ display: 'block', marginTop: 8, fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--slate-500)' }}>
                        Answered by <strong>{ans.username}</strong> on {ans.createdAt ? new Date(ans.createdAt).toLocaleDateString() : 'Unknown Date'}
                      </span>
                    </div>
                  ))}
                  {(!q.answers || q.answers.filter(a => a.isAccepted).length === 0) && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate-500)' }}>No accepted answer provided yet.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
