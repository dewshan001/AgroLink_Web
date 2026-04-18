import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { Context } from "../../context/Context";
import "./comments.css";

const PF = "http://localhost:5000/images/";
const getAvatarSrc = (src) =>
  !src ? null :
  src.startsWith("http://") || src.startsWith("https://") ? src : PF + src;

// Renders a round avatar: profile pic if available, else letter initial
function Avatar({ profilePic, username, small = false }) {
  const src = getAvatarSrc(profilePic);
  const cls = small ? "commentItemAvatar commentItemAvatarReply" : "commentItemAvatar";
  if (src) {
    return (
      <img
        className={cls}
        src={src}
        alt={username}
        style={{ objectFit: "cover" }}
        onError={(e) => {
          e.target.style.display = "none";
          e.target.nextSibling && (e.target.nextSibling.style.display = "flex");
        }}
      />
    );
  }
  return (
    <div className={cls}>
      {username.charAt(0).toUpperCase()}
    </div>
  );
}

export default function Comments({ postId }) {
  const { user } = useContext(Context);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // inline edit state
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  // reply state
  const [replyingTo, setReplyingTo] = useState(null); // comment._id
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState(null);

  useEffect(() => {
    if (!postId) return;
    const fetchComments = async () => {
      try {
        const res = await axios.get(`/comments?postId=${postId}`);
        setComments(res.data);
      } catch (err) {
        // silently fail on fetch
      }
    };
    fetchComments();
  }, [postId]);

  // Separate top-level comments and build a replies map
  const topLevel = comments.filter((c) => !c.parentId);
  const repliesMap = comments.reduce((acc, c) => {
    if (c.parentId) {
      acc[c.parentId] = acc[c.parentId] ? [...acc[c.parentId], c] : [c];
    }
    return acc;
  }, {});

  // ── Post top-level comment ───────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post("/comments", {
        postId,
        username: user.username,
        text: text.trim(),
      });
      setComments((prev) => [...prev, res.data]);
      setText("");
    } catch (err) {
      setError("Failed to post comment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────
  const handleDelete = async (commentId) => {
    try {
      await axios.delete(`/comments/${commentId}`, {
        data: { username: user.username },
      });
      // Remove the comment and any of its replies
      setComments((prev) =>
        prev.filter((c) => c._id !== commentId && c.parentId !== commentId)
      );
    } catch (err) {
      // silently fail
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────────
  const startEdit = (c) => {
    setEditingId(c._id);
    setEditText(c.text);
    setEditError(null);
    setReplyingTo(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
    setEditError(null);
  };

  const handleUpdate = async (commentId) => {
    if (!editText.trim()) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const res = await axios.put(`/comments/${commentId}`, {
        username: user.username,
        text: editText.trim(),
      });
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? res.data : c))
      );
      cancelEdit();
    } catch (err) {
      setEditError("Failed to update comment. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  // ── Reply ────────────────────────────────────────────────────────────
  const startReply = (commentId) => {
    setReplyingTo(commentId);
    setReplyText("");
    setReplyError(null);
    setEditingId(null);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyText("");
    setReplyError(null);
  };

  const handleReply = async (parentId) => {
    if (!replyText.trim()) return;
    setReplyLoading(true);
    setReplyError(null);
    try {
      const res = await axios.post("/comments", {
        postId,
        username: user.username,
        text: replyText.trim(),
        parentId,
      });
      setComments((prev) => [...prev, res.data]);
      cancelReply();
    } catch (err) {
      setReplyError("Failed to post reply. Please try again.");
    } finally {
      setReplyLoading(false);
    }
  };

  // ── Reusable comment card ─────────────────────────────────────────────
  const renderComment = (c, isReply = false) => (
    <div className={`commentItem ${isReply ? "commentItemReply" : ""}`} key={c._id}>
      <Avatar profilePic={c.profilePic} username={c.username} small={isReply} />
      <div className="commentItemBody">
        <div className="commentItemHeader">
          <span className="commentItemUsername">{c.username}</span>
          <span className="commentItemDate">
            {new Date(c.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
          {user?.username === c.username && editingId !== c._id && (
            <div className="commentItemActions">
              <button
                className="commentActionBtn commentUpdateBtn"
                title="Edit"
                onClick={() => startEdit(c)}
              >
                <i className="far fa-edit"></i> Edit
              </button>
              <button
                className="commentActionBtn commentDeleteBtn"
                title="Delete"
                onClick={() => handleDelete(c._id)}
              >
                <i className="far fa-trash-alt"></i> Delete
              </button>
            </div>
          )}
        </div>

        {editingId === c._id ? (
          <div className="commentEditArea">
            <input
              className="commentInput commentEditInput"
              type="text"
              value={editText}
              maxLength={500}
              autoFocus
              onChange={(e) => setEditText(e.target.value)}
            />
            {editError && (
              <p className="commentError">
                <i className="fas fa-exclamation-circle"></i> {editError}
              </p>
            )}
            <div className="commentEditActions">
              <span className="commentCharCount">{editText.length}/500</span>
              <button className="commentActionBtn commentCancelEditBtn" onClick={cancelEdit}>
                Cancel
              </button>
              <button
                className="commentActionBtn commentSaveBtn"
                disabled={editLoading || !editText.trim()}
                onClick={() => handleUpdate(c._id)}
              >
                {editLoading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <><i className="fas fa-check"></i> Save</>
                )}
              </button>
            </div>
          </div>
        ) : (
          <p className="commentItemText">{c.text}</p>
        )}

        {/* Reply button — only for top-level, only when not editing */}
        {!isReply && editingId !== c._id && (
          <div className="commentReplyTrigger">
            {user ? (
              replyingTo === c._id ? null : (
                <button
                  className="commentReplyBtn"
                  onClick={() => startReply(c._id)}
                >
                  <i className="fas fa-reply"></i> Reply
                </button>
              )
            ) : null}
          </div>
        )}

        {/* Inline reply form */}
        {replyingTo === c._id && (
          <div className="commentReplyForm">
            <div className="commentInputRow">
              <div className="commentAvatar commentAvatarSm">
                {user.profilePic ? (
                  <img
                    src={getAvatarSrc(user.profilePic)}
                    alt={user.username}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                  />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
              <input
                className="commentInput"
                type="text"
                placeholder={`Reply to ${c.username}...`}
                value={replyText}
                maxLength={500}
                autoFocus
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleReply(c._id);
                  if (e.key === "Escape") cancelReply();
                }}
              />
            </div>
            {replyError && (
              <p className="commentError">
                <i className="fas fa-exclamation-circle"></i> {replyError}
              </p>
            )}
            <div className="commentEditActions">
              <span className="commentCharCount">{replyText.length}/500</span>
              <button className="commentActionBtn commentCancelEditBtn" onClick={cancelReply}>
                Cancel
              </button>
              <button
                className="commentActionBtn commentSaveBtn"
                disabled={replyLoading || !replyText.trim()}
                onClick={() => handleReply(c._id)}
              >
                {replyLoading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <><i className="fas fa-paper-plane"></i> Reply</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Nested replies */}
        {!isReply && repliesMap[c._id] && repliesMap[c._id].length > 0 && (
          <div className="commentRepliesList">
            {repliesMap[c._id].map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="commentsSection">
      <h3 className="commentsTitle">
        <i className="far fa-comments"></i> Comments
        <span className="commentsCount">{comments.length}</span>
      </h3>

      {user ? (
        <form className="commentForm" onSubmit={handleSubmit}>
          <div className="commentInputRow">
            <div className="commentAvatar">
              {user.profilePic ? (
                <img
                  src={getAvatarSrc(user.profilePic)}
                  alt={user.username}
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                />
              ) : (
                user.username.charAt(0).toUpperCase()
              )}
            </div>
            <input
              className="commentInput"
              type="text"
              placeholder="Write a comment..."
              value={text}
              maxLength={500}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          {error && (
            <p className="commentError">
              <i className="fas fa-exclamation-circle"></i> {error}
            </p>
          )}
          <div className="commentFormActions">
            <span className="commentCharCount">{text.length}/500</span>
            <button
              type="submit"
              className="commentSubmitBtn"
              disabled={loading || !text.trim()}
            >
              {loading ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <><i className="fas fa-paper-plane"></i> Post</>
              )}
            </button>
          </div>
        </form>
      ) : (
        <p className="commentLoginPrompt">
          <i className="fas fa-lock"></i> Please{" "}
          <a href="/login" className="commentLoginLink">log in</a>{" "}
          to leave a comment.
        </p>
      )}

      <div className="commentsList">
        {topLevel.length === 0 ? (
          <div className="commentsEmpty">
            <i className="far fa-comment-dots"></i>
            <span>No comments yet. Be the first!</span>
          </div>
        ) : (
          topLevel.map((c) => renderComment(c, false))
        )}
      </div>
    </div>
  );
}
