import { createContext, useEffect, useReducer, useRef, useCallback } from "react";
import Reducer from "./Reducer";
import axios from "axios";

function normalizeUser(user) {
  if (!user || typeof user !== "object") return user;
  const username = (user.username || "").trim();
  if (username) return user;

  const fallback = (user.name || "").trim() || (user.email || "").trim();
  if (!fallback) return user;

  return { ...user, username: fallback };
}

const INITIAL_STATE = {
  user: (() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      try {
        return normalizeUser(JSON.parse(storedUser));
      } catch (err) {
        console.log("Failed to parse user:", err);
        return null;
      }
    }
    return null;
  })(),
  isFetching: false,
  error: false,
  isVerified: false,
  showVModal: false,
  showDModal: false,
  adminSidebarOpen: false,
  theme: localStorage.getItem("theme") || "light",
  showInactivityWarning: false,
  sessionTimeoutEnabled: (() => {
    const stored = localStorage.getItem("sessionTimeoutEnabled");
    if (stored === null) return true;
    return stored === "true";
  })(),
};

export const Context = createContext(INITIAL_STATE);

export const ContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(Reducer, INITIAL_STATE);
  const inactivityTimerRef = useRef(null);
  const warningTimerRef = useRef(null);

  // Handle auto logout
  const handleAutoLogout = useCallback(async () => {
    console.log("Auto logout triggered");
    try {
      if (state.user && state.user._id) {
        await axios.post(`/auth/logout/${state.user._id}`);
      }
    } catch (err) {
      console.error("Logout error:", err);
    }

    dispatch({ type: "LOGOUT" });
    sessionStorage.removeItem("user");
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    window.location.replace("/login");
  }, [state.user]);

  // Start inactivity timer (15 seconds)
  const startInactivityTimer = useCallback(() => {
    // Clear any existing timers
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

    // Respect user/admin preference: if disabled, don't start timers.
    if (!state.sessionTimeoutEnabled) {
      dispatch({ type: "HIDE_INACTIVITY_WARNING" });
      return;
    }

    inactivityTimerRef.current = setTimeout(() => {
      console.log("Inactivity timeout reached - showing warning modal");
      dispatch({ type: "SHOW_INACTIVITY_WARNING" });

      // Start warning countdown (10 seconds) - auto logout if no response
      warningTimerRef.current = setTimeout(() => {
        console.log("Warning timeout reached - auto logging out");
        handleAutoLogout();
      }, 10000); // 10 seconds
    }, 30000); // 30 seconds of inactivity
  }, [state.sessionTimeoutEnabled, dispatch, handleAutoLogout]);

  // Reset inactivity timer on activity
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    dispatch({ type: "HIDE_INACTIVITY_WARNING" });
    startInactivityTimer();
  }, [startInactivityTimer]);

  const setSessionTimeoutEnabled = useCallback((enabled) => {
    dispatch({ type: "SET_SESSION_TIMEOUT_ENABLED", payload: Boolean(enabled) });
  }, []);

  // Handle extend session
  const handleExtendSession = useCallback(() => {
    console.log("Session extended");
    dispatch({ type: "EXTEND_SESSION" });
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, []);

  // Start inactivity timer when user logs in
  useEffect(() => {
    if (state.user && state.sessionTimeoutEnabled) {
      startInactivityTimer();
    } else {
      // Clear timers when user logs out
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      dispatch({ type: "HIDE_INACTIVITY_WARNING" });
    }
  }, [state.user, state.sessionTimeoutEnabled, startInactivityTimer]);

  useEffect(() => {
    sessionStorage.setItem("user", JSON.stringify(normalizeUser(state.user)));
  }, [state.user]);

  useEffect(() => {
    localStorage.setItem("theme", state.theme);
  }, [state.theme]);

  useEffect(() => {
    localStorage.setItem("sessionTimeoutEnabled", String(state.sessionTimeoutEnabled));
  }, [state.sessionTimeoutEnabled]);

  return (
    <Context.Provider
      value={{
        user: state.user,
        isFetching: state.isFetching,
        isVerified: state.isVerified,
        showVModal: state.showVModal,
        showDModal: state.showDModal,
        adminSidebarOpen: state.adminSidebarOpen,
        theme: state.theme,
        showInactivityWarning: state.showInactivityWarning,
        sessionTimeoutEnabled: state.sessionTimeoutEnabled,
        dispatch,
        resetInactivityTimer,
        setSessionTimeoutEnabled,
        handleExtendSession,
        handleAutoLogout,
        inactivityTimerRef,
        warningTimerRef,
      }}
    >
      {children}
    </Context.Provider>
  );
};