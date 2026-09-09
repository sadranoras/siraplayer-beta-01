const express = require("express");
const path = require("path");
const { Readable } = require("stream");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/proxy", async (req, res) => {
    try {
        const videoUrl = req.query.url;

        if (!videoUrl) {
            return res.status(400).send("Video URL is required");
        }

        let target;

        try {
            target = new URL(videoUrl);
        } catch {
            return res.status(400).send("Invalid URL");
        }

        if (!["http:", "https:"].includes(target.protocol)) {
            return res.status(400).send("Only HTTP/HTTPS URLs are allowed");
        }

        // فعلاً برای MP4
        if (!target.pathname.toLowerCase().endsWith(".mp4")) {
            return res.status(400).send(
                "This proxy currently supports direct MP4 files."
            );
        }

        const headers = {};

        // پشتیبانی از Seek
        if (req.headers.range) {
            headers.Range = req.headers.range;
        }

        const response = await fetch(target.toString(), {
            method: "GET",
            headers
        });

        if (!response.ok && response.status !== 206) {
            return res.status(response.status).send(
                `Upstream server returned ${response.status}`
            );
        }

        res.status(response.status);

        const contentType =
            response.headers.get("content-type") || "video/mp4";

        res.setHeader("Content-Type", contentType);
        res.setHeader("Accept-Ranges", "bytes");

        const contentLength = response.headers.get("content-length");
        const contentRange = response.headers.get("content-range");

        if (contentLength) {
            res.setHeader("Content-Length", contentLength);
        }

        if (contentRange) {
            res.setHeader("Content-Range", contentRange);
        }

        if (response.headers.get("cache-control")) {
            res.setHeader(
                "Cache-Control",
                response.headers.get("cache-control")
            );
        }

        if (!response.body) {
            return res.end();
        }

        Readable.fromWeb(response.body).pipe(res);

    } catch (error) {
        console.error(error);

        if (!res.headersSent) {
            res.status(500).send(
                "Could not load the video from the source server."
            );
        }
    }
});

app.listen(PORT, () => {
    console.log(`Streamly is running at:`);
    console.log(`http://localhost:${PORT}`);
});