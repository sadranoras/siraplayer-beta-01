const express = require("express");
const { Readable } = require("stream");

const app = express();

const PORT = process.env.PORT || 10000;

// =========================
// CORS
// =========================

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Range, Content-Type"
    );
    res.setHeader(
        "Access-Control-Expose-Headers",
        "Content-Length, Content-Range, Accept-Ranges, Content-Type"
    );

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});


// =========================
// HEALTH CHECK
// =========================

app.get("/", (req, res) => {
    res.json({
        status: "ok",
        service: "Streamly Backend"
    });
});


// =========================
// VIDEO PROXY
// =========================

app.get("/api/proxy", async (req, res) => {
    try {
        const videoUrl = req.query.url;

        if (!videoUrl) {
            return res.status(400).json({
                error: "Video URL is required"
            });
        }

        let target;

        try {
            target = new URL(videoUrl);
        } catch {
            return res.status(400).json({
                error: "Invalid URL"
            });
        }

        // فقط HTTP و HTTPS
        if (!["http:", "https:"].includes(target.protocol)) {
            return res.status(400).json({
                error: "Only HTTP/HTTPS URLs are allowed"
            });
        }

        // فعلاً فقط MP4
        if (!target.pathname.toLowerCase().endsWith(".mp4")) {
            return res.status(400).json({
                error: "Only direct MP4 files are supported"
            });
        }

        const headers = {
            "User-Agent": "Streamly/1.0"
        };

        // ارسال Range برای Seek و Streaming
        if (req.headers.range) {
            headers.Range = req.headers.range;
        }

        const response = await fetch(target.toString(), {
            method: "GET",
            headers
        });

        if (!response.ok && response.status !== 206) {
            return res.status(response.status).json({
                error: `Source server returned ${response.status}`
            });
        }

        res.status(response.status);

        // Content-Type
        const contentType =
            response.headers.get("content-type") ||
            "video/mp4";

        res.setHeader("Content-Type", contentType);

        // Range support
        res.setHeader("Accept-Ranges", "bytes");

        const contentLength =
            response.headers.get("content-length");

        if (contentLength) {
            res.setHeader(
                "Content-Length",
                contentLength
            );
        }

        const contentRange =
            response.headers.get("content-range");

        if (contentRange) {
            res.setHeader(
                "Content-Range",
                contentRange
            );
        }

        const cacheControl =
            response.headers.get("cache-control");

        if (cacheControl) {
            res.setHeader(
                "Cache-Control",
                cacheControl
            );
        }

        if (!response.body) {
            return res.end();
        }

        // Stream source → user
        Readable
            .fromWeb(response.body)
            .pipe(res);

    } catch (error) {
        console.error("Proxy error:", error);

        if (!res.headersSent) {
            res.status(500).json({
                error: "Could not load video from source server"
            });
        }
    }
});


// =========================
// START SERVER
// =========================

app.listen(PORT, "0.0.0.0", () => {
    console.log(
        `Streamly backend running on port ${PORT}`
    );
});