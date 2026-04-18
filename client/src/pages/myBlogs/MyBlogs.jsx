import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Context } from "../../context/Context";
import "./myBlogs.css";

const PF = "http://localhost:5000/images/";
const getPhotoSrc = (src) =>
    src && (src.startsWith("http://") || src.startsWith("https://")) ? src : PF + src;

const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};

export default function MyBlogs() {
    const [posts, setPosts] = useState([]);
    const { user } = useContext(Context);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                // authorRequestsOwn=true bypasses the "Approved only" filter in the backend
                const res = await axios.get(`/posts?user=${user.username}&authorRequestsOwn=true`);
                setPosts(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        if (user) {
            fetchPosts();
        }
    }, [user]);

    if (!user) {
        navigate("/login");
        return null;
    }

    return (
        <div className="myBlogs">
            <div className="myBlogsHeader">
                <h1>My Blogs</h1>
                <p>Manage all your written posts here</p>
            </div>

            <div className="myBlogsContainer">
                {posts.length === 0 ? (
                    <div className="myBlogsEmpty">
                        <p>You haven't written any blogs yet.</p>
                        <Link to="/write" className="link myBlogsWriteBtn">Write a Blog</Link>
                    </div>
                ) : (
                    <div className="myBlogsPosts">
                        {posts.map((post) => (
                            <div className="myBlogPost" key={post._id}>
                                {/* Image */}
                                <div className="myBlogPostImgWrapper">
                                    {post.photo ? (
                                        <img className="myBlogPostImg" src={getPhotoSrc(post.photo)} alt={post.title} />
                                    ) : (
                                        <div className="myBlogPostImgPlaceholder">
                                            <i className="fas fa-leaf"></i>
                                        </div>
                                    )}
                                    {/* Status Badge */}
                                    {post.status && (
                                        <span className={`myBlogPostStatusBadge status-${post.status.toLowerCase()}`}>
                                            {post.status}
                                        </span>
                                    )}
                                    {post.categories?.length > 0 && (
                                        <span className="myBlogPostCatBadge">{post.categories[0]}</span>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="myBlogPostInfo">
                                    <div className="myBlogPostMeta">
                                        <span className="myBlogPostDate">
                                            {new Date(post.createdAt).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </span>
                                    </div>

                                    <Link to={`/post/${post._id}`} className="link">
                                        <h3 className="myBlogPostTitle">{post.title}</h3>
                                    </Link>

                                    <p className="myBlogPostDesc">{stripHtml(post.desc)}</p>

                                    <div className="myBlogPostActions">
                                        <Link to={`/post/${post._id}`} className="link btn-view">
                                            View
                                        </Link>
                                        {/* The SinglePost page handles its own edit/update mode */}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
