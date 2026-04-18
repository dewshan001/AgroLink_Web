import "./settings.css";
import Sidebar from "../../components/sidebar/Sidebar";
import FarmImageUpload from "../../components/farmImageUpload/FarmImageUpload";
import { useContext, useState, useEffect } from "react";
import { Context } from "../../context/Context";
import axios from "axios";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";

export default function Settings() {
  const { user, isVerified, dispatch } = useContext(Context);

  const [file, setFile] = useState(null);
  const [username, setUsername] = useState(user.username);
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [farmImages, setFarmImages] = useState(user?.farmImages || []);

  useEffect(() => {
    if (user && !isVerified) {
      dispatch({ type: "SHOW_VMODAL" });
    }
  }, [user, isVerified, dispatch]);

  useEffect(() => {
    const fetchOwnPosts = async () => {
      if (!user?.username || !isVerified) return;
      setPostsLoading(true);
      try {
        const res = await axios.get(`/posts?user=${encodeURIComponent(user.username)}&authorRequestsOwn=true`);
        setPosts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setPosts([]);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchOwnPosts();
  }, [user?.username, isVerified]);

  useEffect(() => {
    if (!confirmDelete) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [confirmDelete]);

  const requestDeletePost = (postId) => {
    setConfirmDelete({ type: "single", postId });
  };

  const requestDeleteAllPosts = () => {
    if (!posts.length) return;
    setConfirmDelete({ type: "all" });
  };

  const closeDeleteModal = () => {
    setConfirmDelete(null);
  };

  const handleDeletePost = async (postId) => {
    setDeletingPostId(postId);
    setError(null);
    try {
      await axios.delete(`/posts/${postId}`, { data: { username: user.username } });
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      const message = err?.response?.data || "Failed to delete post.";
      setError(String(message));
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleDeleteAllPosts = async () => {
    if (!posts.length) return;
    setDeletingAll(true);
    setError(null);
    try {
      const ids = posts.map((p) => p._id);
      const results = await Promise.allSettled(
        ids.map((id) => axios.delete(`/posts/${id}`, { data: { username: user.username } }))
      );

      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed === 0) {
        setPosts([]);
      } else {
        const deletedIds = ids.filter((_, i) => results[i].status === "fulfilled");
        setPosts((prev) => prev.filter((p) => !deletedIds.includes(p._id)));
        setError(`Some posts could not be deleted (${failed}). Please try again.`);
      }
    } catch (err) {
      setError("Failed to delete posts.");
    } finally {
      setDeletingAll(false);
    }
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === "single" && confirmDelete.postId) {
      await handleDeletePost(confirmDelete.postId);
    }
    if (confirmDelete.type === "all") {
      await handleDeleteAllPosts();
    }
    setConfirmDelete(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch({ type: "UPDATE_START" });
    setError(null);
    setSuccess(false);

    if (!username || !email) {
      setError("Username and Email are required.");
      dispatch({ type: "UPDATE_FAILURE" });
      return;
    }

    const updatedUser = { userId: user._id, username, name, email };

    if (password) {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        dispatch({ type: "UPDATE_FAILURE" });
        return;
      }
      updatedUser.password = password;
    }

    if (file) {
      const data = new FormData();
      data.append("file", file);
      data.append("folder", "agrolink/profiles");
      try {
        const uploadRes = await axios.post("/upload", data);
        updatedUser.profilePic = uploadRes.data?.secure_url || uploadRes.data?.url;
        if (!updatedUser.profilePic) {
          throw new Error("Missing uploaded image URL");
        }
      } catch (err) {
        setError("Profile image upload failed. Please try again.");
        dispatch({ type: "UPDATE_FAILURE" });
        return;
      }
    }

    setSaving(true);
    try {
      const res = await axios.put("/users/" + user._id, updatedUser);
      setSuccess(true);
      dispatch({ type: "UPDATE_SUCCESS", payload: res.data });
    } catch (err) {
      dispatch({ type: "UPDATE_FAILURE" });
      const errorMsg = typeof err.response?.data === "string"
        ? err.response.data : "Something went wrong.";
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const PF = "http://localhost:5000/images/";
  // Handle both local filenames and old Cloudinary URLs already in the DB
  const getImageSrc = (src) =>
    src && (src.startsWith("http://") || src.startsWith("https://")) ? src : PF + src;
  const avatarSrc = file ? URL.createObjectURL(file) : (user.profilePic ? getImageSrc(user.profilePic) : null);

  const deleteConfirmModal = confirmDelete
    ? createPortal(
      <div className="settingsConfirmContainer">
        <div className="settingsConfirmBackdrop" onClick={closeDeleteModal}></div>
        <div className="settingsConfirmModal fadeIn">
          <div className="settingsConfirmIcon">
            <i className="fas fa-trash-alt"></i>
          </div>
          <h3 className="settingsConfirmTitle">
            {confirmDelete.type === "all" ? "Delete all posts?" : "Delete this post?"}
          </h3>
          <p className="settingsConfirmText">
            {confirmDelete.type === "all"
              ? "This will permanently remove all your posts. This action cannot be undone."
              : "This post will be permanently deleted. This action cannot be undone."}
          </p>
          <div className="settingsConfirmActions">
            <button type="button" className="settingsConfirmCancel" onClick={closeDeleteModal}>
              Cancel
            </button>
            <button type="button" className="settingsConfirmDelete" onClick={confirmDeleteAction}>
              Yes, Delete
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
    : null;

  return (
    <div className="settings fadeIn">
      <div className="settingsMain">
        {isVerified ? (
          <form className="settingsForm" onSubmit={handleSubmit}>

            {/* Header */}
            <div className="settingsHeader">
              <div>
                <h1 className="settingsHeading">Account Settings</h1>
                <p className="settingsSubheading">Manage your profile and preferences</p>
              </div>
              <div className="settingsHeaderActions">
                <button
                  type="button"
                  className="settingsDangerBtn"
                  onClick={() => dispatch({ type: "SHOW_DMODAL" })}
                >
                  <i className="fas fa-trash-alt"></i> Delete Account
                </button>
                <button className="settingsSaveBtn" type="submit" disabled={saving}>
                  {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-check"></i> Save Changes</>}
                </button>
              </div>
            </div>

            {/* Alerts */}
            {success && (
              <div className="alert alert-success">
                <i className="fas fa-check-circle"></i>
                <span>Profile updated successfully!</span>
              </div>
            )}
            {error && (
              <div className="alert alert-error">
                <i className="fas fa-exclamation-circle"></i>
                <span>{String(error)}</span>
              </div>
            )}

            {/* Profile Picture Card */}
            <div className="settingsCard">
              <div className="settingsCardTitle">
                <i className="fas fa-camera"></i>
                Profile Picture
              </div>
              <div className="settingsPP">
                <div className="settingsPPLeft">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="Profile"
                      onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
                  ) : null}
                  <div className="settingsPPDefault" style={{ display: avatarSrc ? "none" : "flex" }}>
                    <i className="fas fa-user"></i>
                  </div>
                </div>
                <div className="settingsPPRight">
                  <p className="settingsPPHint">Upload a profile photo. JPG, PNG or GIF. Max 5MB.</p>
                  <label htmlFor="fileInput" className="settingsPPBtn">
                    <i className="fas fa-upload"></i>
                    {file ? "Change Photo" : "Upload Photo"}
                  </label>
                  {file && (
                    <button type="button" className="settingsPPRemove" onClick={() => setFile(null)}>
                      <i className="fas fa-times"></i> Remove
                    </button>
                  )}
                  <input type="file" id="fileInput" style={{ display: "none" }} accept="image/*"
                    onChange={(e) => setFile(e.target.files[0])} />
                </div>
              </div>
            </div>

            {/* Personal Info Card */}
            <div className="settingsCard">
              <div className="settingsCardTitle">
                <i className="fas fa-user-edit"></i>
                Personal Information
              </div>
              <div className="settingsGrid">
                <div className="settingsField">
                  <label className="settingsLabel">Username</label>
                  <input className="settingsInput" type="text" value={username}
                    onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div className="settingsField">
                  <label className="settingsLabel">Full Name</label>
                  <input className="settingsInput" type="text" value={name}
                    placeholder="Enter your full name..."
                    onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="settingsField">
                  <label className="settingsLabel">Email Address</label>
                  <input className="settingsInput" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Farm Images Card - For Experts Only */}
            {user?.role === "expert" && user?.verificationStatus !== "approved" && (
              <div className="settingsCard">
                <div className="settingsCardTitle">
                  <i className="fas fa-tractor"></i>
                  Farm & Paddy Field Images
                </div>
                
                {user?.verificationStatus === "rejected" && user?.verificationNotes && (
                  <div className="settingsWarningAlert">
                    <i className="fas fa-exclamation-triangle"></i>
                    <div>
                      <strong>Verification Rejected</strong>
                      <p>{user.verificationNotes}</p>
                      <p>Please update your farm images and resubmit for approval.</p>
                    </div>
                  </div>
                )}
                
                {user?.verificationStatus === "pending" && (
                  <div className="settingsInfoAlert">
                    <i className="fas fa-info-circle"></i>
                    <div>
                      <p><strong>Awaiting Admin Verification</strong></p>
                      <p>Your farm images are pending admin review. You can update them anytime by deleting and re-uploading.</p>
                    </div>
                  </div>
                )}

                <div className="settingsFarmImagesInfo">
                  <p>Current images: <strong>{farmImages.length}</strong></p>
                  <p className="settingsEditHint">
                    <i className="fas fa-pencil-alt"></i>
                    Hover over images to delete them
                  </p>
                </div>

                {farmImages && farmImages.length > 0 && (
                  <div className="settingsFarmImageGallery">
                    <label className="settingsFarmImageLabel">Current Farm Images:</label>
                    <div className="settingsFarmImageGrid">
                      {farmImages.map((img, idx) => (
                        <div key={idx} className="settingsFarmImagePreview">
                          <img src={img.image} alt={`Farm ${idx + 1}`} />
                          <span className="settingsFarmImageIndex">{idx + 1}</span>
                          <button
                            type="button"
                            className="settingsFarmImageDelete"
                            onClick={() => {
                              const newImages = farmImages.filter((_, i) => i !== idx);
                              setFarmImages(newImages);
                            }}
                            title="Delete image"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Security Card */}
            <div className="settingsCard">
              <div className="settingsCardTitle">
                <i className="fas fa-lock"></i>
                Security
              </div>
              <div className="settingsField">
                <label className="settingsLabel">New Password <span className="settingsOptional">(leave blank to keep current)</span></label>
                <input className="settingsInput" type="password" placeholder="Enter a new password..."
                  value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            {/* My Posts Card */}
            <div className="settingsCard">
              <div className="settingsCardTitle settingsPostsTitleRow">
                <span>
                  <i className="fas fa-newspaper"></i>
                  My Posts
                </span>
                <button
                  type="button"
                  className="settingsDeleteAllPostsBtn"
                  onClick={requestDeleteAllPosts}
                  disabled={!posts.length || deletingAll || postsLoading}
                >
                  {deletingAll ? "Deleting..." : "Delete All"}
                </button>
              </div>

              {postsLoading ? (
                <div className="settingsPostsLoading">Loading your posts...</div>
              ) : posts.length === 0 ? (
                <div className="settingsPostsEmpty">You have no posts yet.</div>
              ) : (
                <div className="settingsPostsList">
                  {posts.map((post) => (
                    <div key={post._id} className="settingsPostItem">
                      <div className="settingsPostInfo">
                        <Link to={`/post/${post._id}`} className="settingsPostLink">
                          {post.title}
                        </Link>
                        <div className="settingsPostMeta">
                          <span>{new Date(post.createdAt).toDateString()}</span>
                          <span className={`settingsPostStatus status-${String(post.status || "Approved").toLowerCase()}`}>
                            {post.status || "Approved"}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="settingsPostDeleteBtn"
                        onClick={() => requestDeletePost(post._id)}
                        disabled={deletingPostId === post._id || deletingAll}
                        title="Delete this post"
                      >
                        {deletingPostId === post._id ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          <i className="fas fa-trash-alt"></i>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </form>
        ) : (
          <div className="settingsLocked">
            <div className="settingsLockedIcon">
              <i className="fas fa-shield-alt"></i>
            </div>
            <h2>Security Check Required</h2>
            <p>Please verify your identity to access account settings.</p>
          </div>
        )}
      </div>
      <Sidebar />
      {deleteConfirmModal}
    </div>
  );
}
