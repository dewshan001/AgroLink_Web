const router = require("express").Router();

// Simple in-memory throttle to respect Nominatim usage guidelines (~1 request/second).
// Note: This is process-local (not shared across multiple server instances).
let lastReverseRequestAt = 0;

function toFiniteNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// GET /api/geocode/reverse?lat=...&lng=...&zoom=18
router.get("/reverse", async (req, res) => {
  try {
    const lat = toFiniteNumber(req.query.lat);
    const lng = toFiniteNumber(req.query.lng);
    const zoom = toFiniteNumber(req.query.zoom) ?? 18;

    if (lat === null || lng === null) {
      return res.status(400).json({ message: "lat and lng are required numbers" });
    }

    const now = Date.now();
    const elapsed = now - lastReverseRequestAt;
    if (elapsed < 1000) {
      return res.status(429).json({
        message: "Too many reverse-geocode requests; try again shortly.",
        retryAfterMs: 1000 - elapsed,
      });
    }
    lastReverseRequestAt = now;

    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("zoom", String(Number.isFinite(zoom) ? zoom : 18));
    url.searchParams.set("addressdetails", "1");

    const userAgent =
      process.env.NOMINATIM_USER_AGENT ||
      "Agrolink/1.0 (reverse-geocode; contact: set NOMINATIM_USER_AGENT env var)";

    const upstream = await fetch(url, {
      headers: {
        "User-Agent": userAgent,
        "Accept": "application/json",
        "Accept-Language": "en",
      },
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      console.error("[GET /api/geocode/reverse] Upstream error", upstream.status, text);
      return res.status(502).json({ message: "Reverse-geocoding failed" });
    }

    const data = await upstream.json();

    return res.status(200).json({
      lat: data.lat ?? String(lat),
      lng: data.lon ?? String(lng),
      display_name: data.display_name ?? "",
      address: data.address ?? null,
    });
  } catch (err) {
    console.error("[GET /api/geocode/reverse]", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
