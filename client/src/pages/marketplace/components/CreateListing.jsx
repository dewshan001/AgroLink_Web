import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { Context } from "../../../context/Context";
import "./createListing.css";

export default function CreateListing({ setActiveTab, initialProduct }) {
    const [cropName, setCropName] = useState(initialProduct ? initialProduct.crop_name : "");
    const [categoryId, setCategoryId] = useState(initialProduct ? initialProduct.category_id : "");
    const [quantity, setQuantity] = useState(initialProduct ? initialProduct.quantity : "");
    const [price, setPrice] = useState(initialProduct ? initialProduct.price : "");
    const [location, setLocation] = useState(initialProduct ? initialProduct.location : "");
    const [phone, setPhone] = useState(initialProduct ? initialProduct.phone || "" : "");
    const [description, setDescription] = useState(initialProduct ? initialProduct.description : "");
    const [file, setFile] = useState(null);
    const [customCategory, setCustomCategory] = useState("");
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState(null);
    const [phoneError, setPhoneError] = useState("");
    const [loading, setLoading] = useState(false);

    const { user } = useContext(Context);

    const agricultureCategories = [
        "Vegetables",
        "Fruits",
        "Grains & Cereals",
        "Pulses & Legumes",
        "Spices & Herbs",
        "Cash Crops",
        "Leafy Greens",
        "Root & Tubers",
        "Seeds & Seedlings",
        "Organic Produce",
        "Other (Specify)"
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!user) {
            setError("User is not logged in");
            setLoading(false);
            console.error("User is not logged in");
            return;
        }

        const phoneRegex = /^\d{10}$/;
        const cleanPhone = phone.replace(/[-.\s]/g, "");
        if (!phoneRegex.test(cleanPhone)) {
            setPhoneError("Please enter a valid 10-digit phone number (e.g., 0716615672)");
            setLoading(false);
            return;
        }
        setPhoneError("");

        const finalCategory = categoryId === "Other (Specify)" ? customCategory : categoryId;

        const newProduct = {
            crop_name: cropName,
            category_id: finalCategory,
            quantity,
            price,
            location,
            phone,
            description,
            username: user.username, // for validation in backend
            seller_id: user.username,
        };

        if (file) {
            const data = new FormData();
            const filename = Date.now() + file.name;
            data.append("name", filename);
            data.append("file", file);
            try {
                const uploadRes = await axios.post("/upload", data);
                // Assuming uploadRes.data.url contains the Cloudinary URL
                newProduct.image_url = uploadRes.data.url || uploadRes.data;
            } catch (err) {
                console.log(err);
                setError(err.response?.data?.message || err.response?.data || err.message || "Image upload failed");
                setLoading(false);
                return;
            }
        } else if (initialProduct && initialProduct.image_url) {
            newProduct.image_url = initialProduct.image_url;
        }

        try {
            if (initialProduct) {
                await axios.put(`/products/${initialProduct._id}`, newProduct);
            } else {
                await axios.post("/products", newProduct);
            }
            setLoading(false);
            setActiveTab("listings"); // redirect back to listings
        } catch (err) {
            console.error("API error:", err);
            setError(err.response?.data?.message || err.response?.data || err.message || "Something went wrong!");
            setLoading(false);
        }
    };

    return (
        <div className="createListing">
            <form className="createListingForm" onSubmit={handleSubmit}>
                <div className="createListingGroup">
                    {file ? (
                        <img className="createListingImg" src={URL.createObjectURL(file)} alt="" />
                    ) : initialProduct?.image_url ? (
                        <img className="createListingImg" src={initialProduct.image_url} alt="" />
                    ) : null}
                    <label htmlFor="fileInput">
                        <i className="createListingIcon fas fa-plus"></i> Add Image
                    </label>
                    <input
                        type="file"
                        id="fileInput"
                        style={{ display: "none" }}
                        onChange={(e) => setFile(e.target.files[0])}
                    />
                </div>

                <div className="createListingGroup">
                    <input
                        type="text"
                        placeholder="Crop Name (e.g., Organic Tomatoes)"
                        className="createListingInput"
                        autoFocus={true}
                        required
                        value={cropName}
                        onChange={(e) => setCropName(e.target.value)}
                    />
                </div>

                <div className="createListingGroup split">
                    <select
                        className="createListingInput selectCategory"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        required
                    >
                        <option value="" disabled>Select a Category...</option>
                        {agricultureCategories.map((cat, index) => (
                            <option key={index} value={cat}>{cat}</option>
                        ))}
                    </select>

                    {categoryId === "Other (Specify)" && (
                        <input
                            type="text"
                            placeholder="Please specify your category"
                            className="createListingInput"
                            required
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            style={{ marginTop: "0px" }}
                        />
                    )}

                    <input
                        type="number"
                        placeholder="Price ($)"
                        className="createListingInput"
                        required
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />
                </div>

                <div className="createListingGroup split">
                    <input
                        type="text"
                        placeholder="Quantity (e.g., 50 kg)"
                        className="createListingInput"
                        required
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                    />

                    <input
                        type="text"
                        placeholder="Location"
                        className="createListingInput"
                        required
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    />
                </div>

                <div className="createListingGroup" style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                    <input
                        type="tel"
                        placeholder="Phone Number (e.g., 0716615672)"
                        className="createListingInput"
                        required
                        value={phone}
                        onChange={(e) => {
                            setPhone(e.target.value);
                            setPhoneError("");
                        }}
                    />
                    {phoneError && <span style={{ color: "red", fontSize: "14px", marginTop: "5px", alignSelf: "flex-start" }}>{phoneError}</span>}
                </div>

                <div className="createListingGroup">
                    <textarea
                        placeholder="Describe your product..."
                        type="text"
                        className="createListingInput createListingText"
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                </div>

                <button className="createListingSubmit" type="submit" disabled={loading}>
                    {loading ? (initialProduct ? "Updating..." : "Publishing...") : (initialProduct ? "Update Listing" : "Publish Listing")}
                </button>
                {error && <span className="createListingError" style={{color: 'red', marginTop: '10px'}}>{typeof error === 'string' ? error : "Something went wrong!"}</span>}
            </form>
        </div>
    );
}
