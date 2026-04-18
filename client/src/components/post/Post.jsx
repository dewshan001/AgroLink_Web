import "./post.css"
import { Link } from "react-router-dom"

const PF = "http://localhost:5000/images/";
// Handle both local filenames and any old Cloudinary URLs already in the DB
const getPhotoSrc = (src) =>
  src && (src.startsWith("http://") || src.startsWith("https://")) ? src : PF + src;

// Strip HTML tags so the card preview shows plain text
const stripHtml = (html) => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};

export default function Post({ post }) {
  return (
    <div className="post">
      {/* Image */}
      <div className="postImgWrapper">
        {post.photo ? (
          <img className="postImg" src={getPhotoSrc(post.photo)} alt={post.title} />
        ) : (
          <div className="postImgPlaceholder">
            <i className="fas fa-leaf"></i>
          </div>
        )}
        <div className="postImgOverlay"></div>
        {post.categories?.length > 0 && (
          <span className="postCatBadge">{post.categories[0]}</span>
        )}
      </div>

      {/* Content */}
      <div className="postInfo">
        <div className="postMeta">
          <div className="postAuthorPill">
            <div className="postAuthorAvatar">
              {post.authorPic ? (
                <img
                  src={
                    post.authorPic.startsWith("http://") || post.authorPic.startsWith("https://")
                      ? post.authorPic
                      : PF + post.authorPic
                  }
                  alt={post.username}
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling && (e.target.nextSibling.style.display = "flex");
                  }}
                />
              ) : null}
              <i
                className="fas fa-user"
                style={{ display: post.authorPic ? "none" : "block" }}
              ></i>
            </div>
            <span className="postAuthorName">{post.username}</span>
          </div>
          <span className="postDate">
            {new Date(post.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        <Link to={`/post/${post._id}`} className="link">
          <h3 className="postTitle">{post.title}</h3>
        </Link>

        <p className="postDesc">{stripHtml(post.desc)}</p>

        <Link to={`/post/${post._id}`} className="link postReadMore">
          Read Article <i className="fas fa-arrow-right"></i>
        </Link>
      </div>
    </div>
  )
}
