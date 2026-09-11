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

// =========================
// VIDEO PROXY
// =========================

app.get("/api/proxy", async (req, res) => {
    try {
        const videoUrl = req.query.url;

        if (!videoUrl) {
            return res.status(400).json({
                error: "VIDEO_URL_REQUIRED",
                message: "Video URL is required"
            });
        }

        let target;

        try {
            target = new URL(videoUrl);
        } catch {
            return res.status(400).json({
                error: "INVALID_URL",
                message: "The video URL is invalid"
            });
        }

        if (!["http:", "https:"].includes(target.protocol)) {
            return res.status(400).json({
                error: "INVALID_PROTOCOL",
                message: "Only HTTP and HTTPS URLs are supported"
            });
        }

        const headers = {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
            "Accept":
                "video/mp4,video/*;q=0.9,*/*;q=0.8"
        };

        if (req.headers.range) {
            headers.Range = req.headers.range;
        }

        const response = await fetch(target.toString(), {
            method: "GET",
            headers,
            redirect: "follow"
        });

        // =========================
        // HTTP ERROR HANDLING
        // =========================

        if (!response.ok && response.status !== 206) {

            if (response.status === 401) {
                return res.status(401).json({
                    error: "UNAUTHORIZED",
                    message:
                        "This video requires authorization"
                });
            }

            if (response.status === 403) {
                return res.status(403).json({
                    error: "FORBIDDEN",
                    message:
                        "The source server does not allow access to this video"
                });
            }

            if (response.status === 404) {
                return res.status(404).json({
                    error: "NOT_FOUND",
                    message:
                        "The video could not be found"
                });
            }

            if (response.status >= 500) {
                return res.status(502).json({
                    error: "SOURCE_SERVER_ERROR",
                    message:
                        "The video source server is currently unavailable"
                });
            }

            return res.status(response.status).json({
                error: "SOURCE_ERROR",
                message:
                    `Source server returned HTTP ${response.status}`
            });
        }

        // =========================
        // CONTENT TYPE
        // =========================

        const contentType =
            response.headers.get("content-type") || "";

        const mimeType =
            contentType
                .toLowerCase()
                .split(";")[0]
                .trim();

        if (mimeType !== "video/mp4") {
            return res.status(415).json({
                error: "NOT_MP4",
                message:
                    "The provided URL does not point to an MP4 video",
                contentType:
                    contentType || "unknown"
            });
        }

        // =========================
        // RESPONSE HEADERS
        // =========================

        res.status(response.status);

        res.setHeader(
            "Content-Type",
            contentType
        );

        res.setHeader(
            "Accept-Ranges",
            "bytes"
        );

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

        // =========================
        // STREAM
        // =========================

        if (!response.body) {
            return res.status(502).json({
                error: "EMPTY_RESPONSE",
                message:
                    "The video source returned an empty response"
            });
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
            return res.status(502).json({
                error: "PROXY_ERROR",
                message:
                    "Could not connect to the video source"
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
