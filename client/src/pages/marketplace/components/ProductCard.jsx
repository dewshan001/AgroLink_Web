import React, { useState } from "react";
import "./productCard.css";

export default function ProductCard({ product, isOwner, onEdit, onDelete }) {
    const [showContact, setShowContact] = useState(false);
    const PF = "http://localhost:5000/images/";

    // Format price
    const formattedPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(product.price);

    return (
        <div className="productCard">
            <div className="productCardImgWrapper">
                {product.image_url ? (
                    <img className="productCardImg" src={product.image_url} alt={product.crop_name} />
                ) : (
                    <div className="productCardImgPlaceholder">
                        <i className="fas fa-box-open"></i>
                    </div>
                )}
                <div className="productCardImgOverlay"></div>
                <span className="productCardBadge">{product.category_id}</span>
                
                {isOwner && (
                    <div className="productCardOwnerActions">
                        <button className="iconBtn editBtn" onClick={onEdit} title="Edit Listing">
                            <i className="fas fa-edit"></i>
                        </button>
                        <button className="iconBtn deleteBtn" onClick={onDelete} title="Delete Listing">
                            <i className="fas fa-trash"></i>
                        </button>
                    </div>
                )}
            </div>

            <div className="productCardInfo">
                <div className="productCardHeader">
                    <h3 className="productCardTitle">{product.crop_name}</h3>
                    <span className="productCardPrice">{formattedPrice}</span>
                </div>

                <p className="productCardDesc">{product.description}</p>

                <div className="productCardDetails">
                    <div className="productDetail">
                        <i className="fas fa-weight-hanging"></i>
                        <span>{product.quantity}</span>
                    </div>
                    <div className="productDetail">
                        <i className="fas fa-map-marker-alt"></i>
                        <span>{product.location}</span>
                    </div>
                </div>

                <div className="productCardFooter">
                    <div className="productCardSeller">
                        <div className="sellerAvatar">
                            <i className="fas fa-user-circle"></i>
                        </div>
                        <span className="sellerName">{product.seller_id}</span>
                    </div>
                    <button 
                        className="productCardContactBtn"
                        onClick={() => setShowContact(!showContact)}
                    >
                        {showContact ? (product.phone || "Not provided") : "Contact"}
                    </button>
                </div>
            </div>
        </div>
    );
}
