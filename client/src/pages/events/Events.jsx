import "./Events.css";
import { useEffect, useMemo, useRef, useState, useContext } from "react";
import axios from "axios";
import { Context } from "../../context/Context";
import { useToast } from "../../components/admin/Toast";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";

const emptyForm = {
    title: "",
    date: "",
    location: "",
    geoLat: "",
    geoLng: "",
    description: "",
};

const emptyErrors = {
    title: "",
    date: "",
    location: "",
};

const SL_DEFAULT_CENTER = { lat: 7.8731, lng: 80.7718 };
const SL_BOUNDS = {
    north: 9.835,
    south: 5.918,
    west: 79.652,
    east: 81.881,
};

L.Icon.Default.mergeOptions({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function clamp(n, min, max) {
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, n));
}

function normalizeLatLngToSriLanka({ lat, lng }) {
    return {
        lat: clamp(lat, SL_BOUNDS.south, SL_BOUNDS.north),
        lng: clamp(lng, SL_BOUNDS.west, SL_BOUNDS.east),
    };
}

function MapClickPicker({ onPick }) {
    useMapEvents({
        click(e) {
            const next = normalizeLatLngToSriLanka({ lat: e.latlng.lat, lng: e.latlng.lng });
            onPick(next);
        },
    });
    return null;
}

function toNumberOrNull(value) {
    if (value === "" || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function buildOsmEmbedUrl({ lat, lng, zoom = 8 }) {
    const useLat = Number.isFinite(lat) ? lat : SL_DEFAULT_CENTER.lat;
    const useLng = Number.isFinite(lng) ? lng : SL_DEFAULT_CENTER.lng;
    const z = Number.isFinite(zoom) ? zoom : 8;
    const delta = 0.6;
    const left = useLng - delta;
    const right = useLng + delta;
    const top = useLat + delta;
    const bottom = useLat - delta;
    const marker = Number.isFinite(lat) && Number.isFinite(lng) ? `&marker=${useLat}%2C${useLng}` : "";
    return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik${marker}&zoom=${z}`;
}

function buildOsmViewLink({ lat, lng, zoom = 16 }) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const z = Number.isFinite(zoom) ? zoom : 16;
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${z}/${lat}/${lng}`;
}

function getEventBadge(dateStr) {
    if (!dateStr) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventDate = new Date(dateStr);
    eventDate.setHours(0, 0, 0, 0);

    return eventDate >= today ? "Upcoming" : "Past";
}

function getTodayInputValue() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
        today.getDate()
    ).padStart(2, "0")}`;
}

export default function Events() {
    const { user } = useContext(Context);
    const isAdminOrExpert = user && (user.isAdmin || user.role === "expert");

    const { toast, ToastContainer } = useToast();

    const [events, setEvents] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [formErrors, setFormErrors] = useState(emptyErrors);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");

    const [locationManuallyEdited, setLocationManuallyEdited] = useState(false);
    const locationManuallyEditedRef = useRef(false);

    useEffect(() => {
        locationManuallyEditedRef.current = locationManuallyEdited;
    }, [locationManuallyEdited]);

    const [eventModalOpen, setEventModalOpen] = useState(false);

    const [registerOpen, setRegisterOpen] = useState(false);
    const [registeringEvent, setRegisteringEvent] = useState(null);
    const [registerForm, setRegisterForm] = useState({ name: "", phone: "", email: "" });
    const [registerLoading, setRegisterLoading] = useState(false);

    const [locationModalOpen, setLocationModalOpen] = useState(false);
    const [selectedLocationEvent, setSelectedLocationEvent] = useState(null);

    const openLocationModal = (event) => {
        setSelectedLocationEvent(event);
        setLocationModalOpen(true);
    };

    const closeLocationModal = () => {
        setLocationModalOpen(false);
        setSelectedLocationEvent(null);
    };

    const isEditing = useMemo(() => Boolean(editingId), [editingId]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/events");
            setEvents(res.data || []);
        } catch (err) {
            toast.error(err?.response?.data?.message || err.message || "Failed to load events");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "location") {
            setLocationManuallyEdited(true);
        }

        setForm((prev) => ({ ...prev, [name]: value }));

        if (formErrors[name]) {
            setFormErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const resetForm = () => {
        setForm(emptyForm);
        setFormErrors(emptyErrors);
        setEditingId(null);
        setLocationManuallyEdited(false);
    };

    const openCreateModal = () => {
        resetForm();
        setEventModalOpen(true);
    };

    const closeEventModal = () => {
        setEventModalOpen(false);
        resetForm();
        setFormSubmitting(false);
    };

    const startEdit = (ev) => {
        setEditingId(ev._id);

        const d = ev.date ? new Date(ev.date) : null;
        const yyyyMmDd = d
            ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
                d.getDate()
            ).padStart(2, "0")}`
            : "";

        setForm({
            title: ev.title || "",
            date: yyyyMmDd,
            location: ev.location || "",
            geoLat: ev?.geo?.lat === 0 || ev?.geo?.lat ? String(ev.geo.lat) : "",
            geoLng: ev?.geo?.lng === 0 || ev?.geo?.lng ? String(ev.geo.lng) : "",
            description: ev.description || "",
        });

        setFormErrors(emptyErrors);
        setLocationManuallyEdited(true);
        setEventModalOpen(true);
    };

    const reverseGeocodeToLocation = async ({ lat, lng }) => {
        try {
            const res = await axios.get("/geocode/reverse", {
                params: { lat, lng },
            });
            const displayName = (res?.data?.display_name || "").trim();
            return displayName || null;
        } catch (err) {
            if (err?.response?.status === 429) {
                return null;
            }

            console.error("Reverse geocode failed:", err);
            return null;
        }
    };

    const validateForm = () => {
        const errors = { ...emptyErrors };
        const trimmedTitle = form.title.trim();
        const trimmedLocation = form.location.trim();
        const today = getTodayInputValue();

        if (!trimmedTitle) {
            errors.title = "Title is required";
        }

        if (!form.date) {
            errors.date = "Date is required";
        } else if (!isEditing && form.date < today) {
            errors.date = "Past dates are not allowed for new events";
        }

        if (!trimmedLocation) {
            errors.location = "Location is required";
        }

        setFormErrors(errors);

        return !errors.title && !errors.date && !errors.location;
    };

    const removeEvent = async (id) => {
        const ok = window.confirm("Are you sure you want to delete this event?");
        if (!ok) return;
        try {
            await axios.delete(`/events/${id}`, { data: { userId: user ? user._id : null } });
            setEvents((prev) => prev.filter((e) => e._id !== id));
            toast.success("Event deleted successfully");
        } catch (err) {
            toast.error(err?.response?.data?.message || err.message || "Delete failed");
        }
    };

    const submit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        const lat = toNumberOrNull(form.geoLat);
        const lng = toNumberOrNull(form.geoLng);

        const payload = {
            title: form.title.trim(),
            date: form.date,
            location: form.location.trim(),
            geo: lat !== null && lng !== null ? { lat, lng } : { lat: null, lng: null },
            description: form.description.trim(),
            userId: user ? user._id : null
        };

        setFormSubmitting(true);

        try {
            if (isEditing) {
                const res = await axios.put(`/events/${editingId}`, payload);
                setEvents((prev) => prev.map((ev) => (ev._id === editingId ? res.data : ev)));
                toast.success("Event updated successfully");
            } else {
                const res = await axios.post("/events", payload);
                setEvents((prev) => [res.data, ...prev]);
                toast.success("Event created successfully");
            }

            closeEventModal();
        } catch (err) {
            toast.error(err?.response?.data?.message || err.message || "Save failed");
            setFormSubmitting(false);
        }
    };

    const filteredEvents = events.filter((ev) => {
        const q = (search || "").toLowerCase();
        const title = (ev.title || "").toLowerCase();
        const location = (ev.location || "").toLowerCase();
        const desc = (ev.description || "").toLowerCase();
        const badge = getEventBadge(ev.date);

        const matchesSearch = title.includes(q) || location.includes(q) || desc.includes(q);
        const matchesFilter = filter === "All" ? true : badge === filter;

        return matchesSearch && matchesFilter;
    });

    const openRegister = (ev) => {
        setRegisteringEvent(ev);
        // Auto-populate with user's details if logged in
        if (user) {
            setRegisterForm({
                name: user.name || user.username || "",
                phone: user.phone || "",
                email: user.email || "",
            });
        } else {
            setRegisterForm({ name: "", phone: "", email: "" });
        }
        setRegisterOpen(true);
    };

    const isUserAlreadyRegistered = (event) => {
        if (!user) return false;
        if (!event?.attendees || event.attendees.length === 0) return false;
        
        // Check if current user's phone or email is already in attendees list
        return event.attendees.some((a) => {
            if (user.phone && a.phone === user.phone) return true;
            if (user.email && a.email && a.email.toLowerCase() === user.email.toLowerCase()) return true;
            return false;
        });
    };

    const closeRegister = () => {
        setRegisterOpen(false);
        setRegisteringEvent(null);
        setRegisterForm({ name: "", phone: "", email: "" });
        setRegisterLoading(false);
    };

    const handleRegisterChange = (e) => {
        const { name, value } = e.target;
        
        // Phone number validation: only digits, max 10
        if (name === "phone") {
            const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
            setRegisterForm((prev) => ({ ...prev, [name]: digitsOnly }));
        } else {
            setRegisterForm((prev) => ({ ...prev, [name]: value }));
        }
    };

    const submitRegister = async (e) => {
        e.preventDefault();
        if (!registeringEvent?._id) return;

        const name = registerForm.name.trim();
        const phone = registerForm.phone.trim();
        const email = registerForm.email.trim();

        if (!name) {
            toast.error("Name is required to register");
            return;
        }
        if (!phone) {
            toast.error("Phone is required to register");
            return;
        }
        if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
            toast.error("Phone number must be exactly 10 digits");
            return;
        }

        setRegisterLoading(true);

        try {
            const res = await axios.post(`/events/${registeringEvent._id}/register`, {
                name,
                phone,
                email,
            });

            const updatedEvent = res?.data?.event;
            if (updatedEvent?._id) {
                setEvents((prev) => prev.map((ev) => (ev._id === updatedEvent._id ? updatedEvent : ev)));
            } else {
                await fetchEvents();
            }

            toast.success(res?.data?.message || "Registered successfully");
            closeRegister();
        } catch (err) {
            toast.error(err?.response?.data?.message || err.message || "Registration failed");
            setRegisterLoading(false);
        }
    };

    return (
        <div className="events-page">
            <ToastContainer />
            <div className="events-header">
                <div className="events-header-left">
                    <span className="events-logo-icon">🌿</span>
                    <div>
                        <h1 className="events-title">AgroLink Events</h1>
                        <p className="events-subtitle">Manage and track agricultural events</p>
                    </div>
                </div>

                <div className="events-header-actions">
                    <button className="btn btn-outline" type="button" onClick={fetchEvents}>
                        🔄 Refresh
                    </button>
                    {isAdminOrExpert && (
                        <button className="btn btn-primary btn-add-event" type="button" onClick={openCreateModal}>
                            ➕ Add New Event
                        </button>
                    )}
                </div>
            </div>

            <div className="events-list-section events-list-section--full">
                <div className="events-list-header">
                    <div className="events-list-top-left">
                        <h2 className="events-list-title">
                            All Events
                            <span className="events-count">{filteredEvents.length}</span>
                        </h2>

                        <div className="events-filters">
                            {["All", "Upcoming", "Past"].map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    className={`filter-chip ${filter === item ? "filter-chip--active" : ""}`}
                                    onClick={() => setFilter(item)}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    <input
                        className="events-search"
                        type="text"
                        placeholder="🔍 Search events..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="events-loading">
                        <div className="spinner" />
                        <p>Loading events…</p>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="events-empty">
                        <span className="events-empty-icon">📭</span>
                        <p>{search || filter !== "All" ? "No events match your current filters." : "No events yet. Create one!"}</p>
                    </div>
                ) : (
                    <div className="events-grid">
                        {filteredEvents.map((ev) => {
                            const badge = getEventBadge(ev.date);
                            const attendeesCount = ev.attendees?.length || 0;
                            const mapLink = buildOsmViewLink({ lat: ev?.geo?.lat, lng: ev?.geo?.lng });

                            return (
                                <div key={ev._id} className="event-card">
                                    <div className="event-card-top">
                                        <div className="event-card-info">
                                            <div className="event-card-title-row">
                                                <h3 className="event-card-name">{ev.title}</h3>
                                                {badge && (
                                                    <span className={`event-badge event-badge--${badge.toLowerCase()}`}>
                                                        {badge}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="event-card-meta">
                                                <span className="event-meta-item">
                                                    📅{" "}
                                                    {ev.date
                                                        ? new Date(ev.date).toLocaleDateString("en-US", {
                                                            year: "numeric",
                                                            month: "short",
                                                            day: "numeric",
                                                        })
                                                        : ""}
                                                </span>
                                                <span className="event-meta-sep">•</span>
                                                <span className="event-meta-item">📍 {ev.location}</span>

                                                {mapLink && (
                                                    <>
                                                        <span className="event-meta-sep">•</span>
                                                        <button
                                                            type="button"
                                                            className="event-map-link"
                                                            onClick={() => openLocationModal(ev)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: 'inherit',
                                                                cursor: 'pointer',
                                                                padding: 0,
                                                                font: 'inherit',
                                                                textDecoration: 'none',
                                                            }}
                                                        >
                                                            🗺 View on map
                                                        </button>
                                                    </>
                                                )}

                                                {attendeesCount > 0 && (
                                                    <>
                                                        <span className="event-meta-sep">•</span>
                                                        <span className="event-meta-item">👥 {attendeesCount} Registered</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {ev.description && <p className="event-card-description">{ev.description}</p>}

                                    <div className="event-card-actions">
                                        {badge === "Upcoming" && !isAdminOrExpert && (
                                            <button 
                                                className={`btn ${isUserAlreadyRegistered(ev) ? "btn-registered" : "btn-register"}`} 
                                                onClick={() => !isUserAlreadyRegistered(ev) && openRegister(ev)} 
                                                type="button"
                                                disabled={isUserAlreadyRegistered(ev)}
                                            >
                                                {isUserAlreadyRegistered(ev) ? "✅ Registered" : "📝 Register"}
                                            </button>
                                        )}

                                        {isAdminOrExpert && (
                                            <>
                                                <button className="btn btn-edit" onClick={() => startEdit(ev)} type="button">
                                                    ✏️ Edit
                                                </button>

                                                <button className="btn btn-delete" onClick={() => removeEvent(ev._id)} type="button">
                                                    🗑 Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {eventModalOpen && (
                <div className="modal-overlay" onClick={closeEventModal}>
                    <div className="modal modal--form" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header modal-header--green">
                            <h3 className="modal-title">{isEditing ? "Edit Event" : "Add New Event"}</h3>
                            <button className="modal-close" onClick={closeEventModal} type="button">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={submit} className="modal-form">
                            <div className="modal-body">
                                <div className="form-row-2">
                                <div className="form-group">
                                    <label className="form-label">Title *</label>
                                    <input
                                        className={`form-input ${formErrors.title ? "form-input--error" : ""}`}
                                        name="title"
                                        value={form.title}
                                        onChange={handleChange}
                                        placeholder="e.g., Farmers Meetup"
                                    />
                                    {formErrors.title && <span className="field-error">{formErrors.title}</span>}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Date *</label>
                                    <input
                                        className={`form-input ${formErrors.date ? "form-input--error" : ""}`}
                                        type="date"
                                        name="date"
                                        value={form.date}
                                        min={isEditing ? undefined : getTodayInputValue()}
                                        onChange={handleChange}
                                    />
                                    {formErrors.date && <span className="field-error">{formErrors.date}</span>}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Location *</label>
                                <input
                                    className={`form-input ${formErrors.location ? "form-input--error" : ""}`}
                                    name="location"
                                    value={form.location}
                                    onChange={handleChange}
                                    placeholder="e.g., Hadapanagala, Wellawaya"
                                />
                                {formErrors.location && <span className="field-error">{formErrors.location}</span>}
                            </div>
                                <details className="map-picker-collapsible">
                                    <summary className="map-picker-summary">
                                        📍 Pick location on Sri Lanka map <span className="form-label-optional">(optional)</span>
                                    </summary>

                                    <div className="map-picker">
                                        <div className="map-picker-embed">
                                            <MapContainer
                                                center={[SL_DEFAULT_CENTER.lat, SL_DEFAULT_CENTER.lng]}
                                                zoom={8}
                                                scrollWheelZoom={true}
                                                className="leaflet-map"
                                            >
                                                <TileLayer
                                                    attribution='&copy; OpenStreetMap contributors'
                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                />

                                                <MapClickPicker
                                                    onPick={async ({ lat, lng }) => {
                                                        const nextLat = String(lat.toFixed(6));
                                                        const nextLng = String(lng.toFixed(6));

                                                        setForm((prev) => ({
                                                            ...prev,
                                                            geoLat: nextLat,
                                                            geoLng: nextLng,
                                                        }));

                                                        if (locationManuallyEditedRef.current) return;

                                                        const displayName = await reverseGeocodeToLocation({ lat, lng });
                                                        if (!displayName) return;

                                                        setForm((prev) => {
                                                            if (locationManuallyEditedRef.current) return prev;
                                                            return { ...prev, location: displayName };
                                                        });
                                                    }}
                                                />

                                                {toNumberOrNull(form.geoLat) !== null && toNumberOrNull(form.geoLng) !== null && (
                                                    <Marker position={[toNumberOrNull(form.geoLat), toNumberOrNull(form.geoLng)]} />
                                                )}
                                            </MapContainer>
                                        </div>

                                        <div className="map-picker-fields">
                                            <div className="form-row-2">
                                                <div className="form-group">
                                                    <label className="form-label">Latitude</label>
                                                    <input
                                                        className="form-input"
                                                        name="geoLat"
                                                        value={form.geoLat}
                                                        onChange={handleChange}
                                                        placeholder="e.g., 6.9271"
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">Longitude</label>
                                                    <input
                                                        className="form-input"
                                                        name="geoLng"
                                                        value={form.geoLng}
                                                        onChange={handleChange}
                                                        placeholder="e.g., 79.8612"
                                                    />
                                                </div>
                                            </div>

                                            <div className="map-picker-actions">
                                                <button
                                                    className="btn btn-outline"
                                                    type="button"
                                                    onClick={() => setForm((prev) => ({ ...prev, geoLat: String(SL_DEFAULT_CENTER.lat), geoLng: String(SL_DEFAULT_CENTER.lng) }))}
                                                >
                                                    📌 Use Sri Lanka center
                                                </button>

                                                <button
                                                    className="btn btn-ghost"
                                                    type="button"
                                                    onClick={() => setForm((prev) => ({ ...prev, geoLat: "", geoLng: "" }))}
                                                >
                                                    ✖ Clear map location
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </details>

                                <div className="form-group">
                                <label className="form-label">
                                    Description <span className="form-label-optional">(optional)</span>
                                </label>
                                <textarea
                                    className="form-input form-textarea"
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    placeholder="Details about the event..."
                                    rows={4}
                                />
                            </div>

                            </div>

                            <div className="modal-footer">
                                <div className="modal-actions">
                                <button className="btn btn-primary" type="submit" disabled={formSubmitting}>
                                    {formSubmitting
                                        ? isEditing
                                            ? "Updating..."
                                            : "Creating..."
                                        : isEditing
                                            ? "✔ Update Event"
                                            : "➕ Create Event"}
                                </button>

                                    <button className="btn btn-ghost" type="button" onClick={closeEventModal} disabled={formSubmitting}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {locationModalOpen && selectedLocationEvent && (
                <div className="modal-overlay" onClick={closeLocationModal}>
                    <div className="modal modal--map" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header modal-header--map">
                            <h3 className="modal-title">
                                📍 {selectedLocationEvent.location}
                            </h3>
                            <button className="modal-close" onClick={closeLocationModal} type="button">
                                ✕
                            </button>
                        </div>

                        <div className="modal-body" style={{ padding: 0, overflow: 'hidden' }}>
                            <iframe
                                title={`Map for ${selectedLocationEvent.title}`}
                                className="register-map-embed"
                                src={buildOsmEmbedUrl({
                                    lat: selectedLocationEvent?.geo?.lat,
                                    lng: selectedLocationEvent?.geo?.lng,
                                    zoom: 14,
                                })}
                                style={{ width: '100%', height: '500px', border: 'none' }}
                            />
                        </div>

                        <div className="modal-footer" style={{
                            padding: '12px 24px',
                            borderTop: '1px solid var(--glass-border)',
                            textAlign: 'center',
                        }}>
                            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--slate-600)' }}>
                                <strong>Event:</strong> {selectedLocationEvent.title}
                            </p>
                            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--slate-600)' }}>
                                <strong>Date:</strong> {new Date(selectedLocationEvent.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                })}
                            </p>
                            {selectedLocationEvent?.geo?.lat && selectedLocationEvent?.geo?.lng && (
                                <p style={{ margin: '0', fontSize: '12px', color: 'var(--slate-500)' }}>
                                    Coordinates: {selectedLocationEvent.geo.lat.toFixed(4)}, {selectedLocationEvent.geo.lng.toFixed(4)}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {registerOpen && registeringEvent && (
                <div className="modal-overlay" onClick={closeRegister}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Register for: {registeringEvent.title}</h3>
                            <button className="modal-close" onClick={closeRegister} type="button">
                                ✕
                            </button>
                        </div>

                        {isUserAlreadyRegistered(registeringEvent) ? (
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '16px', textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem' }}>✅</div>
                                <h3 style={{ margin: '0', fontSize: '1.1rem', fontWeight: '600', color: 'var(--gray-900)' }}>Already Registered</h3>
                                <p style={{ margin: '0', color: 'var(--gray-600)', fontSize: '0.9rem' }}>You are already registered for this event. Please wait for confirmation details.</p>
                            </div>
                        ) : (
                            <form onSubmit={submitRegister} className="modal-form">
                                <div className="modal-body">
                                    {buildOsmViewLink({ lat: registeringEvent?.geo?.lat, lng: registeringEvent?.geo?.lng }) && (
                                        <div className="register-map">
                                            <div className="register-map-wrapper">
                                                <iframe
                                                    title="Event map"
                                                    className="register-map-embed"
                                                    src={buildOsmEmbedUrl({ lat: registeringEvent.geo.lat, lng: registeringEvent.geo.lng, zoom: 12 })}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label className="form-label">Name *</label>
                                        <input
                                            className="form-input"
                                            name="name"
                                            value={registerForm.name}
                                            onChange={handleRegisterChange}
                                            placeholder="Your name"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Phone *</label>
                                        <input
                                            className="form-input"
                                            name="phone"
                                            value={registerForm.phone}
                                            onChange={handleRegisterChange}
                                            placeholder="07XXXXXXXX"
                                            maxLength="10"
                                        />
                                        <span style={{ fontSize: '0.75rem', color: registerForm.phone.length === 10 ? 'var(--green-600)' : 'var(--gray-500)', marginTop: '4px', display: 'block' }}>
                                            Digits: {registerForm.phone.length}/10
                                        </span>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">
                                            Email <span className="form-label-optional">(optional)</span>
                                        </label>
                                        <input
                                            className="form-input"
                                            name="email"
                                            value={registerForm.email}
                                            onChange={handleRegisterChange}
                                            placeholder="example@gmail.com"
                                            disabled={!!user}
                                        />
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <div className="modal-actions">
                                        <button className="btn btn-ghost" type="button" onClick={closeRegister} disabled={registerLoading}>
                                            Cancel
                                        </button>
                                        <button className="btn btn-primary" type="submit" disabled={registerLoading}>
                                            {registerLoading ? "Registering..." : "✅ Confirm Registration"}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}