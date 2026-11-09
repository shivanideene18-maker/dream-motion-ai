const { spawn } = require("child_process");

function extractVideoInfo(url) {
    return new Promise((resolve, reject) => {
        // Validate URL format
        if (!url || typeof url !== "string" || !/^https?:\/\//i.test(url)) {
            return reject(new Error("Invalid URL. Please provide a valid HTTP/HTTPS link."));
        }

        const args = [
            "--dump-json",
            "--no-playlist",
            "--skip-download",
            "--no-warnings",
            "--",
            url
        ];

        const proc = spawn("yt-dlp", args);
        let stdout = "";
        let stderr = "";

        proc.stdout.on("data", (chunk) => {
            stdout += chunk.toString();
        });

        proc.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });

        proc.on("close", (code) => {
            if (code === 0) {
                try {
                    const data = JSON.parse(stdout);
                    const structured = {
                        id: data.id,
                        title: data.title || "Untitled Video",
                        description: data.description ? data.description.slice(0, 1000) : "",
                        duration: data.duration || 0,
                        durationFormatted: formatDuration(data.duration || 0),
                        thumbnail: data.thumbnail || (data.thumbnails && data.thumbnails.length ? data.thumbnails[0].url : ""),
                        uploader: data.uploader || data.channel || "Unknown Creator",
                        viewCount: data.view_count || 0,
                        likeCount: data.like_count || 0,
                        tags: data.tags || [],
                        categories: data.categories || [],
                        formatsSummary: (data.formats || []).slice(0, 5).map(f => ({
                            formatId: f.format_id,
                            ext: f.ext,
                            resolution: f.resolution || `${f.width}x${f.height}`,
                            filesize: f.filesize ? (f.filesize / 1024 / 1024).toFixed(2) + " MB" : "N/A"
                        }))
                    };
                    resolve(structured);
                } catch (parseErr) {
                    reject(new Error("Failed to parse yt-dlp metadata: " + parseErr.message));
                }
            } else {
                reject(new Error(`yt-dlp error (${code}): ${stderr.slice(-300)}`));
            }
        });

        proc.on("error", (err) => {
            reject(new Error("yt-dlp execution error: " + err.message));
        });
    });
}

function formatDuration(sec) {
    const mins = Math.floor(sec / 60);
    const remainingSec = Math.floor(sec % 60);
    return `${mins}:${remainingSec < 10 ? "0" : ""}${remainingSec}`;
}

module.exports = {
    extractVideoInfo
};
