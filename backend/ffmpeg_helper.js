const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

let ffmpegPath = "ffmpeg";
try {
    const installer = require("@ffmpeg-installer/ffmpeg");
    if (installer && installer.path) {
        ffmpegPath = installer.path;
    }
} catch (e) {
    ffmpegPath = "ffmpeg";
}

function runFFmpeg(args) {
    return new Promise((resolve, reject) => {
        const proc = spawn(ffmpegPath, args);
        let stderr = "";
        proc.stderr.on("data", (d) => {
            stderr += d.toString();
        });
        proc.on("close", (code) => {
            if (code === 0) {
                resolve({ success: true });
            } else {
                reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-300)}`));
            }
        });
        proc.on("error", (err) => {
            reject(new Error(`FFmpeg process failed: ${err.message}`));
        });
    });
}

async function generateProceduralClip(options = {}) {
    const {
        title = "SHIN MOTION AI",
        style = "Cinematic animated storytelling",
        camera = "Slow Pan",
        duration = 3,
        outputPath,
        width = 1280,
        height = 720
    } = options;

    const safeTitle = (title || "SHIN MOTION AI").replace(/[:'\\"]/g, " ").slice(0, 32);
    const safeStyle = (style || "Cinematic 4K").replace(/[:'\\"]/g, " ").slice(0, 32);
    const safeCam = (camera || "Cinematic Pan").replace(/[:'\\"]/g, " ").slice(0, 24);

    const filter = `testsrc=duration=${duration}:size=${width}x${height}:rate=30,drawbox=y=0:color=black@0.4:width=iw:height=ih:t=fill,drawtext=text='SHIN MOTION AI':fontcolor=0xFFB6C1:fontsize=48:x=(w-text_w)/2:y=(h/2)-80,drawtext=text='${safeTitle}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=(h/2)-10,drawtext=text='[${safeStyle}]  •  [Cam\\: ${safeCam}]':fontcolor=0xE8C5D0:fontsize=22:x=(w-text_w)/2:y=(h/2)+60`;

    const args = [
        "-y",
        "-f", "lavfi",
        "-i", filter,
        "-f", "lavfi",
        "-i", `sine=frequency=220:duration=${duration}`,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-shortest",
        outputPath
    ];

    await runFFmpeg(args);
    return outputPath;
}

async function mergeVideoClips(videoPaths, outputPath) {
    if (!videoPaths || videoPaths.length === 0) {
        throw new Error("No video clips provided for concatenation.");
    }
    const listFile = path.join(path.dirname(outputPath), `concat_${Date.now()}.txt`);
    const content = videoPaths.map(p => `file '${path.resolve(p).replace(/'/g, "'\\''")}'`).join("\n");
    fs.writeFileSync(listFile, content, "utf8");

    try {
        const args = [
            "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", listFile,
            "-c", "copy",
            outputPath
        ];
        await runFFmpeg(args);
    } finally {
        if (fs.existsSync(listFile)) {
            fs.unlinkSync(listFile);
        }
    }
    return outputPath;
}

async function trimVideo(inputPath, outputPath, startTime = 0, duration = 3) {
    const args = [
        "-y",
        "-ss", String(startTime),
        "-i", inputPath,
        "-t", String(duration),
        "-c:v", "libx264",
        "-c:a", "aac",
        outputPath
    ];
    await runFFmpeg(args);
    return outputPath;
}

async function changeSpeed(inputPath, outputPath, speedMultiplier = 1.0) {
    const videoFilter = `setpts=${(1 / speedMultiplier).toFixed(4)}*PTS`;
    const audioFilter = `atempo=${speedMultiplier.toFixed(2)}`;

    const args = [
        "-y",
        "-i", inputPath,
        "-filter_complex", `[0:v]${videoFilter}[v];[0:a]${audioFilter}[a]`,
        "-map", "[v]",
        "-map", "[a]",
        "-c:v", "libx264",
        outputPath
    ];
    await runFFmpeg(args);
    return outputPath;
}

async function resizeVideo(inputPath, outputPath, width = 1280, height = 720) {
    const args = [
        "-y",
        "-i", inputPath,
        "-vf", `scale=${width}:${height}`,
        "-c:v", "libx264",
        "-c:a", "copy",
        outputPath
    ];
    await runFFmpeg(args);
    return outputPath;
}

async function addMusicToVideo(videoPath, audioPath, outputPath) {
    const args = [
        "-y",
        "-i", videoPath,
        "-i", audioPath,
        "-c:v", "copy",
        "-c:a", "aac",
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-shortest",
        outputPath
    ];
    await runFFmpeg(args);
    return outputPath;
}

module.exports = {
    runFFmpeg,
    generateProceduralClip,
    mergeVideoClips,
    trimVideo,
    changeSpeed,
    resizeVideo,
    addMusicToVideo
};
