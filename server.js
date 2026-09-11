const express = require("express");
const { Readable } = require("stream");

const app = express();

const PORT = process.env.PORT || 10000;

// =========================
// CORS
// =========================

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, OPTIONS"
    );
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

        // -------------------------
        // Check URL
        // -------------------------

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

        // Only HTTP / HTTPS
        if (!["http:", "https:"].includes(target.protocol)) {
            return res.status(400).json({
                error: "Only HTTP/HTTPS URLs are allowed"
            });
        }

        // -------------------------
        // Request headers
        // -------------------------

        const headers = {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
            "Accept":
                "video/mp4,video/*;q=0.9,*/*;q=0.8"
        };

        // IMPORTANT:
        // Forward browser Range requests.
        // This allows seeking inside the video.

        if (req.headers.range) {
            headers.Range = req.headers.range;
        }

        // -------------------------
        // Fetch source
        // -------------------------

        const response = await fetch(target.toString(), {
            method: "GET",
            headers,
            redirect: "follow"
        });

        // -------------------------
        // Source response check
        // -------------------------

        if (!response.ok && response.status !== 206) {
            return res.status(response.status).json({
                error:
                    `Source server returned ${response.status}`
            });
        }

        // -------------------------
        // Content-Type
        // -------------------------

        const contentType =
            response.headers.get("content-type") ||
            "";

        // Some servers return:
        //
        // video/mp4
        // video/mp4; charset=UTF-8
        //
        // So we only inspect the beginning.

        const isMp4 =
            contentType
                .toLowerCase()
                .split(";")[0]
                .trim() === "video/mp4";

        // -------------------------
        // Allow MP4
        // -------------------------

        if (!isMp4) {
            return res.status(415).json({
                error:
                    "Source is not an MP4 video",
                contentType:
                    contentType || "unknown"
            });
        }

        // -------------------------
        // Response status
        // -------------------------

        res.status(response.status);

        // -------------------------
        // Video headers
        // -------------------------

        res.setHeader(
            "Content-Type",
            contentType
        );

        res.setHeader(
            "Accept-Ranges",
            "bytes"
        );

        // Content-Length

        const contentLength =
            response.headers.get("content-length");

        if (contentLength) {
            res.setHeader(
                "Content-Length",
                contentLength
            );
        }

        // Content-Range

        const contentRange =
            response.headers.get("content-range");

        if (contentRange) {
            res.setHeader(
                "Content-Range",
                contentRange
            );
        }

        // Cache-Control

        const cacheControl =
            response.headers.get("cache-control");

        if (cacheControl) {
            res.setHeader(
                "Cache-Control",
                cacheControl
            );
        }

        // -------------------------
        // Stream video
        // -------------------------

        if (!response.body) {
            return res.end();
        }

        Readable
            .fromWeb(response.body)
            .pipe(res);

    } catch (error) {
        console.error(
            "Proxy error:",
            error
        );

        if (!res.headersSent) {
            return res.status(500).json({
                error:
                    "Could not load video from source server",
                details:
                    error.message
            });
        }
    }
});

// =========================
// START SERVER
// =========================

app.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log(
            `Streamly backend running on port ${PORT}`
        );
    }
);
