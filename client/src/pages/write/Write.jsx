import "./write.css";
import { useContext, useState } from "react";
import axios from "axios";
import { Context } from "../../context/Context";
import RichEditor from "../../components/richEditor/RichEditor";

export default function Write() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [otherCategory, setOtherCategory] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(Context);

  const DEFAULT_CATEGORIES = [
    "Organic Farming",
    "Inorganic Farming",
    "Crop Diseases",
    "Pest Management",
    "Soil Management",
    "Weather & Climate",
    "Crop Growth",
    "Fertilizer Management",
  ];

  const CATEGORY_OPTIONS = [...DEFAULT_CATEGORIES, "Other"];

  const getPlainTextFromHtml = (html) => {
    if (!html) return "";
    return html
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    const storyText = getPlainTextFromHtml(desc);

    if (!trimmedTitle) {
      setError("Please provide a title.");
      return;
    }

    if (!selectedCategory) {
      setError("Please select a category.");
      return;
    }

    if (!storyText) {
      setError("Please write your story before publishing.");
      return;
    }

    const trimmedOther = otherCategory.trim();
    if (selectedCategory === "Other" && !trimmedOther) {
      setError("Please type your category.");
      return;
    }

    const finalCategory = selectedCategory === "Other" ? trimmedOther : selectedCategory;

    setPublishing(true);
    const newPost = { username: user.username, title: trimmedTitle, desc };

    if (finalCategory) {
      if (selectedCategory !== "Other") {
        // Default categories: ensure stored in Category collection
        try {
          await axios.post("/categories", { name: finalCategory });
        } catch (err) {
          setError("Could not save the selected category. Please try again.");
          setPublishing(false);
          return;
        }
        newPost.categories = [finalCategory];
      } else {
        // Custom categories should not appear as sidebar categories.
        // Tag as 'Other' for grouping, but keep the custom label on the post.
        const normalized = DEFAULT_CATEGORIES.find(
          (c) => c.toLowerCase() === finalCategory.toLowerCase()
        );
        if (normalized) {
          // If user typed a known default, treat it as that default.
          try {
            await axios.post("/categories", { name: normalized });
          } catch (err) {
            setError("Could not save the selected category. Please try again.");
            setPublishing(false);
            return;
          }
          newPost.categories = [normalized];
        } else {
          newPost.categories = [finalCategory, "Other"];
        }
      }
    }

    if (file) {
      const data = new FormData();
      data.append("file", file);
      data.append("folder", "agrolink/posts");
      try {
        const uploadRes = await axios.post("/upload", data);
        newPost.photo = uploadRes.data?.secure_url || uploadRes.data?.url;
        newPost.photoPublicId = uploadRes.data?.public_id || null;
        if (!newPost.photo) {
          throw new Error("Missing uploaded image URL");
        }
      } catch (err) {
        console.error("Upload failed", err);
      }
    }
    try {
      const res = await axios.post("/posts", newPost);
      window.location.replace("/post/" + res.data._id);
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data || "Oops! Something went wrong while publishing.";
      setError(message);
      setPublishing(false);
    }
  };

  return (
    <div className="write fadeIn">
      {/* Cover Image Preview */}
      <div className="writeCoverArea">
        {file ? (
          <div className="writeCoverPreview">
            <img src={URL.createObjectURL(file)} alt="Cover" className="writeCoverImg" />
            <div className="writeCoverOverlay">
              <label htmlFor="fileInput" className="writeCoverChange">
                <i className="fas fa-camera"></i> Change Cover
              </label>
              <button className="writeCoverRemove" onClick={() => setFile(null)}>
                <i className="fas fa-times"></i> Remove
              </button>
            </div>
          </div>
        ) : (
          <label htmlFor="fileInput" className="writeCoverUpload">
            <div className="writeCoverUploadInner">
              <i className="fas fa-image"></i>
              <span>Add a cover photo</span>
              <small>Click to browse — recommended 1200×600px</small>
            </div>
          </label>
        )}
        <input
          type="file"
          id="fileInput"
          style={{ display: "none" }}
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </div>

      {/* Editor */}
      <form className="writeEditor" onSubmit={handleSubmit}>
        {/* Toolbar */}
        <div className="writeToolbar">
          <div className="writeToolbarLeft">
            <div className="writeAuthor">
              <div className="writeAuthorAvatar">
                <i className="fas fa-user"></i>
              </div>
              <div>
                <span className="writeAuthorName">{user.username}</span>
                <span className="writeAuthorLabel">Writing a post</span>
              </div>
            </div>
          </div>
          <div className="writeToolbarRight">
            {error && (
              <div className="alert alert-error writeAlert">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
              </div>
            )}
            <button className="writePublishBtn" type="submit" disabled={publishing}>
              {publishing ? (
                <><i className="fas fa-spinner fa-spin"></i> Publishing...</>
              ) : (
                <><i className="fas fa-paper-plane"></i> Publish</>
              )}
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="writeTitleArea">
          <input
            type="text"
            className="writeTitleInput"
            placeholder="Your post title..."
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Category */}
        <div className="writeCategoryArea">
          <i className="fas fa-tag writeCategoryIcon"></i>
          <div className="writeCategorySelectWrap">
            <select
              className="writeCategorySelect"
              value={selectedCategory}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedCategory(value);
                if (value !== "Other") setOtherCategory("");
              }}
            >
              <option value="">Select a category</option>
              {CATEGORY_OPTIONS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          {selectedCategory === "Other" && (
            <input
              type="text"
              className="writeCategoryOtherInput"
              placeholder="Type your category..."
              value={otherCategory}
              onChange={(e) => setOtherCategory(e.target.value)}
            />
          )}
        </div>

        {/* Body */}
        <div className="writeBodyArea">
          <RichEditor
            value={desc}
            onChange={setDesc}
            placeholder="Share your story with the community..."
            minHeight="420px"
          />
        </div>
      </form>
    </div>
  );
}
