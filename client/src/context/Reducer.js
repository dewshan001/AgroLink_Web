const normalizeUser = (user) => {
    if (!user || typeof user !== "object") return user;
    const username = (user.username || "").trim();
    if (username) return user;
    const fallback = (user.name || "").trim() || (user.email || "").trim();
    if (!fallback) return user;
    return { ...user, username: fallback };
};

const Reducer = (state, action) => {
    switch (action.type) {
        case "LOGIN_START":
            return {
                ...state,
                user: null,
                isFetching: true,
                error: false,
                isVerified: false
            };
        case "LOGIN_SUCCESS":
            return {
                ...state,
                user: normalizeUser(action.payload),
                isFetching: false,
                error: false
            };
        case "LOGIN_FAILURE":
            return {
                ...state,
                user: null,
                isFetching: false,
                error: true,
            };
        case "UPDATE_START":
            return {
                ...state,
                isFetching: true
            };
        case "UPDATE_SUCCESS":
            return {
                ...state,
                user: normalizeUser(action.payload),
                isFetching: false,
                error: false
            };
        case "UPDATE_FAILURE":
            return {
                ...state,
                isFetching: false,
                error: true,
            };
        case "LOGOUT":
            return {
                ...state,
                user: null,
                isFetching: false,
                error: false,
                isVerified: false
            };
        case "VERIFY_SUCCESS":
            return {
                ...state,
                isVerified: true,
                showVModal: false
            };
        case "SHOW_VMODAL":
            return {
                ...state,
                showVModal: true
            };
        case "HIDE_VMODAL":
            return {
                ...state,
                showVModal: false
            };
        case "SHOW_DMODAL":
            return {
                ...state,
                showDModal: true
            };
        case "HIDE_DMODAL":
            return {
                ...state,
                showDModal: false
            };
        case "SET_ADMIN_SIDEBAR":
            return {
                ...state,
                adminSidebarOpen: action.payload
            };
        case "SET_ADMIN_TAB":
            return {
                ...state,
                adminActiveTab: action.payload
            };
        case "TOGGLE_THEME":
            return {
                ...state,
                theme: state.theme === "light" ? "dark" : "light"
            };
        case "SHOW_INACTIVITY_WARNING":
            return {
                ...state,
                showInactivityWarning: true
            };
        case "HIDE_INACTIVITY_WARNING":
            return {
                ...state,
                showInactivityWarning: false
            };
        case "EXTEND_SESSION":
            return {
                ...state,
                showInactivityWarning: false
            };
        case "SET_SESSION_TIMEOUT_ENABLED":
            return {
                ...state,
                sessionTimeoutEnabled: Boolean(action.payload),
                showInactivityWarning: Boolean(action.payload) ? state.showInactivityWarning : false,
            };
        default:
            return state;
    }
};

export default Reducer;