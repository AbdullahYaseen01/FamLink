
import express from "express";
import axios from 'axios'
import { getMapPins } from "../Controllers/mapPins.controller.js";
import { rateLimit } from "../Services/utils/rateLimit.js";

const router = express.Router();

// Approximate, PII-free pins for the programmatic city/neighborhood map.
//
// Public by design (it powers the logged-out marketing map), but each call runs
// a geo query over up to 2,000 user documents, so it gets a ceiling. The limit
// is generous: a visitor panning the map fires several of these in a row.
router.get(
    "/map-pins",
    rateLimit({
        name: "map-pins",
        limit: 120,
        windowSec: 60,
        message: "Too many map requests. Please slow down and try again shortly.",
    }),
    getMapPins
);

// Geocode an address typed into the signup form.
//
// This is a proxy in front of Google Maps that spends OUR API key, and it can't
// require a token: the one caller is the join flow, where the visitor has no
// account yet. It was previously wide open — no limit, no input validation, and
// it returned Google's entire raw response — so anyone who found the URL could
// bill our key indefinitely and use us as a free anonymous geocoding service.
//
// Three things keep that in check now:
//   1. A per-IP rate limit, so one caller can't loop on it.
//   2. Input bounds, so a repeated or oversized parameter can't reach the
//      upstream call.
//   3. A trimmed response — only the two fields the signup form reads. Passing
//      Google's full result through is what made this worth abusing; a caller
//      who wants place ids, address components and viewports has to go get
//      their own key.
const MAX_ADDRESS_LENGTH = 300;

router.get(
    "/",
    rateLimit({
        name: "geocode",
        limit: 15,
        windowSec: 60,
        message: "Too many address lookups. Please wait a minute and try again.",
    }),
    async (req, res) => {
        const { address } = req.query;

        // Express gives an array when a parameter is repeated (?address=a&address=b)
        // and an object for bracket syntax, so this has to be a plain string before
        // it goes anywhere near a URL.
        if (typeof address !== "string" || !address.trim()) {
            return res.status(400).json({ message: "Address is required" });
        }

        const query = address.trim();
        if (query.length > MAX_ADDRESS_LENGTH) {
            return res.status(400).json({ message: "Address is too long" });
        }

        if (!process.env.Location_Key) {
            console.error("Geocode requested but Location_Key is not configured");
            return res.status(500).json({ message: "Address lookup is unavailable" });
        }

        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            query
        )}&key=${process.env.Location_Key}`;

        try {
            const response = await axios.get(url, { timeout: 10000 });

            // Only what the client actually uses: the coordinates and the
            // formatted address. Everything else Google returns stays here.
            const results = (response.data?.results || []).slice(0, 5).map((result) => ({
                formatted_address: result.formatted_address,
                geometry: { location: result.geometry?.location },
            }));

            return res.status(200).json({ results });
        } catch (error) {
            // Never forward Google's error body: it can echo the request URL, and
            // the request URL contains our API key.
            console.error("Geocoding request failed:", error?.message || error);
            return res.status(502).json({ message: "Could not look up that address" });
        }
    }
);

export default router
