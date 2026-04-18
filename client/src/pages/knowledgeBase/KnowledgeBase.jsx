import { useEffect, useState } from "react";
import axios from "axios";
import "./knowledgeBase.css";
import { Link } from 'react-router-dom';

export default function KnowledgeBase() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCrop, setSelectedCrop] = useState("All");

    useEffect(() => {
        const fetchArticles = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`http://localhost:5000/api/knowledge?search=${searchQuery}&crop=${selectedCrop}`);
                setArticles(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching knowledge articles:", err);
                setLoading(false);
            }
        };
        fetchArticles();
    }, [searchQuery, selectedCrop]);

    return (
        <div className="about fadeIn">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ color: '#004d40', margin: '0 0 10px 0' }}>Crop Disease Knowledge Base</h1>
                    <p style={{ color: '#555', margin: 0 }}>Search for diseases or filter by crop type to find management strategies.</p>
                </div>
                <Link to="/add-disease" style={{ backgroundColor: '#27ae60', color: 'white', padding: '10px 20px', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold' }}>
                    + Add New Disease
                </Link>
            </div>

            <div className="kbFilterContainer">
                <div className="kbSearchWrapper">
                    <i className="fas fa-search searchIcon"></i>
                    <input
                        type="text"
                        placeholder="Search by disease name..."
                        className="kbSearchInput"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="kbSelectWrapper">
                    <select
                        className="kbSelect"
                        value={selectedCrop}
                        onChange={(e) => setSelectedCrop(e.target.value)}
                    >
                        <option value="All">All Crops</option>
                        <option value="Tomato">Tomato</option>
                        <option value="Paddy">Paddy</option>
                        <option value="Papaya">Papaya</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="kbLoading">
                    <i className="fas fa-spinner fa-spin"></i> Loading Articles...
                </div>
            ) : (
                <div className="kbGrid">
                    {articles.length > 0 ? (
                        articles.map((article) => (
                            <div className="kbCard glass-panel" key={article._id}>
                                <div className="kbCardTop">
                                    {article.imageUrl && (
                                        <img className="kbImg" src={article.imageUrl} alt={article.title} />
                                    )}
                                    <div className="kbBadgeContainer">
                                        {article.diseaseId?.diseaseName && (
                                            <span className="kbBadge disease">{article.diseaseId.diseaseName}</span>
                                        )}
                                        {article.diseaseId?.cropId?.name && (
                                            <span className="kbBadge crop">{article.diseaseId.cropId.name}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="kbCardInfo">
                                    <h2 className="kbCardTitle">{article.title}</h2>

                                    <div className="kbCardBottom">
                                        <Link
                                            to={`/disease-detail/${article.title.toLowerCase().includes("early blight") ? "early-blight" :
                                                article.title.toLowerCase().includes("rice blast") ? "rice-blast" :
                                                    article.title.toLowerCase().includes("papaya ringspot") ? "papaya-ringspot" :
                                                        "rice-blast"
                                                }`}
                                            className="kbReadMore"
                                            style={{ textDecoration: 'none', textAlign: 'center' }}
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="kbEmpty">No articles found matching your criteria.</p>
                    )}
                </div>
            )}
        </div>
    );
}
