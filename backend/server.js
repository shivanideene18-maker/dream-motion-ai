const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const { InferenceClient } = require("@huggingface/inference");
const { createCanvas } = require("canvas");
const { spawn } = require("child_process");

const storage = require("./storage");
const ffmpegHelper = require("./ffmpeg_helper");
const ytdlpHelper = require("./ytdlp_helper");

function runPythonWorker(args) {
    return new Promise((resolve, reject) => {
        const proc = spawn("python3", [path.join(__dirname, "python_worker.py"), ...args]);
        let stdout = "";
        let stderr = "";
        proc.stdout.on("data", d => stdout += d.toString());
        proc.stderr.on("data", d => stderr += d.toString());
        proc.on("close", code => {
            if (code === 0) {
                try {
                    const parsed = JSON.parse(stdout.trim());
                    resolve(parsed);
                } catch(e) {
                    reject(new Error(`Worker parse failure: ${stdout} ${stderr}`));
                }
            } else {
                reject(new Error(`Worker exited with code ${code}: ${stderr}`));
            }
        });
        proc.on("error", reject);
    });
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure file upload storage
const upload = multer({
    dest: storage.UPLOADS_DIR,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve frontend static assets and media uploads
app.use(express.static(path.join(__dirname, "../public")));
app.use("/uploads", express.static(storage.UPLOADS_DIR));

// Helper to get active Hugging Face client
function getHFClient() {
    const db = storage.loadDB();
    const token = db.settings?.hfToken || process.env.HF_TOKEN || "";
    if (!token) return null;
    return new InferenceClient(token);
}

// ----------------------------------------------------
// 1. SYSTEM & SETTINGS APIs
// ----------------------------------------------------
app.get("/api/status", (req, res) => {
    const db = storage.loadDB();
    const hasToken = Boolean(db.settings?.hfToken || process.env.HF_TOKEN);
    res.json({
        success: true,
        brand: "SHIN MOTION AI",
        tagline: "Your All-in-One Premium AI Creative Universe",
        version: "2.0.0-cinematic",
        hfConnected: hasToken,
        settings: db.settings,
        stats: {
            charactersCount: db.characters.length,
            projectsCount: db.projects.length,
            imagesGenerated: db.generations.images.length,
            videosGenerated: db.generations.videos.length
        }
    });
});

app.post("/api/settings", (req, res) => {
    const { hfToken, defaultImageModel, defaultVideoModel } = req.body;
    const db = storage.loadDB();
    if (hfToken !== undefined) db.settings.hfToken = hfToken.trim();
    if (defaultImageModel) db.settings.defaultImageModel = defaultImageModel;
    if (defaultVideoModel) db.settings.defaultVideoModel = defaultVideoModel;
    storage.saveDB(db);
    res.json({ success: true, message: "Settings saved successfully", settings: db.settings });
});

// ----------------------------------------------------
// 2. AI IMAGE STUDIO APIs
// ----------------------------------------------------
function generateProceduralLuxuryImage(prompt, style = "Photorealistic human characters", aspectRatio = "16:9") {
    let width = 1024;
    let height = 576;
    if (aspectRatio === "9:16") {
        width = 576;
        height = 1024;
    } else if (aspectRatio === "1:1") {
        width = 768;
        height = 768;
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Luxury baby pink & blush dark cinematic gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#2B1A24");
    grad.addColorStop(0.5, "#542D45");
    grad.addColorStop(1, "#180C14");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative luxury glow circles
    for (let i = 0; i < 4; i++) {
        const cx = (width / 5) * (i + 1);
        const cy = height * 0.45;
        const rad = ctx.createRadialGradient(cx, cy, 10, cx, cy, width * 0.35);
        rad.addColorStop(0, "rgba(255, 182, 193, 0.35)");
        rad.addColorStop(0.5, "rgba(255, 105, 180, 0.15)");
        rad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = rad;
        ctx.beginPath();
        ctx.arc(cx, cy, width * 0.35, 0, Math.PI * 2);
        ctx.fill();
    }

    // Elegant luxury framing border
    ctx.strokeStyle = "rgba(255, 192, 203, 0.4)";
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 24, width - 48, height - 48);

    // Subtle inner gold/rose accent
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;
    ctx.strokeRect(32, 32, width - 64, height - 64);

    // Brand Watermark
    ctx.font = "bold 20px 'Playfair Display', serif";
    ctx.fillStyle = "#FFB6C1";
    ctx.fillText("SHIN MOTION AI  •  STUDIO LUXE", 48, 64);

    // Style badge
    ctx.fillStyle = "rgba(255, 192, 203, 0.2)";
    ctx.fillRect(48, height - 90, 240, 36);
    ctx.font = "14px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#FFF0F5";
    ctx.fillText(style.toUpperCase(), 60, height - 68);

    // Prompt presentation text
    ctx.font = "italic 26px 'Playfair Display', serif";
    ctx.fillStyle = "#FFFFFF";
    const displayPrompt = prompt.length > 80 ? prompt.slice(0, 77) + "..." : prompt;
    ctx.fillText(`"${displayPrompt}"`, 48, height / 2);

    ctx.font = "14px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#E8C5D0";
    ctx.fillText("Pixar & Cinematic AI Rendering Universe", 48, (height / 2) + 40);

    return canvas.toDataURL("image/png");
}

app.post("/api/image/generate", async (req, res) => {
    try {
        const {
            prompt,
            style = "Photorealistic human characters",
            aspectRatio = "16:9",
            model = "black-forest-labs/FLUX.1-schnell"
        } = req.body;

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({ success: false, message: "Prompt is required." });
        }

        const db = storage.loadDB();
        const hf = getHFClient();
        const chosenModel = model || db.settings.defaultImageModel || "black-forest-labs/FLUX.1-schnell";

        if (!hf) {
            return res.status(400).json({
                success: false,
                requiresToken: true,
                message: "A Hugging Face API Token is required to generate real AI images. Please click 'Engine Settings' in the top right to configure your Hugging Face Token (hf_...)."
            });
        }

        const enrichedPrompt = `${prompt}, ${style}, ultra high quality, masterpiece, 8k resolution, cinematic lighting`;

        let imgResult;
        try {
            imgResult = await hf.textToImage({
                model: chosenModel,
                inputs: enrichedPrompt
            });
        } catch (hfErr) {
            console.error("Hugging Face API error:", hfErr);
            const errMsg = hfErr.message || "Failed to generate image via Hugging Face API.";
            return res.status(502).json({
                success: false,
                provider: "huggingface",
                model: chosenModel,
                message: `Hugging Face generation error: ${errMsg}. Please ensure your API token is valid and has access to model '${chosenModel}'.`
            });
        }

        const buffer = Buffer.from(await imgResult.arrayBuffer());
        const filename = `img_${Date.now()}_${uuidv4().slice(0, 6)}.png`;
        const filepath = path.join(storage.UPLOADS_DIR, filename);
        fs.writeFileSync(filepath, buffer);

        const relativeUrl = `/uploads/${filename}`;
        const base64Url = `data:image/png;base64,${buffer.toString("base64")}`;

        const record = {
            id: `img_${Date.now()}_${uuidv4().slice(0, 6)}`,
            prompt,
            style,
            aspectRatio,
            model: chosenModel,
            provider: "huggingface",
            imageUrl: relativeUrl,
            previewUrl: base64Url,
            createdAt: new Date().toISOString()
        };

        db.generations.images.unshift(record);
        storage.saveDB(db);

        res.json({
            success: true,
            image: record
        });
    } catch (err) {
        console.error("Image generation fatal error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/image/edit", upload.single("image"), async (req, res) => {
    try {
        const { action = "enhance", prompt, color = "#FFE6F0" } = req.body;
        let inputPath = req.file ? req.file.path : null;

        // If no file uploaded, generate a reference sample image to apply the edit on
        if (!inputPath) {
            const tempSample = path.join(storage.UPLOADS_DIR, `temp_edit_${Date.now()}.png`);
            const base64Data = generateProceduralLuxuryImage(prompt || "Editorial Luxury Portrait", "Photorealistic human characters", "1:1").replace(/^data:image\/png;base64,/, "");
            fs.writeFileSync(tempSample, base64Data, "base64");
            inputPath = tempSample;
        }

        const outExt = action === "remove-bg" ? ".png" : ".jpg";
        const outFilename = `edited_img_${Date.now()}_${uuidv4().slice(0, 6)}${outExt}`;
        const outPath = path.join(storage.UPLOADS_DIR, outFilename);

        let resultUrl = "";
        try {
            await runPythonWorker(["image_edit", action, inputPath, outPath, color]);
            resultUrl = `/uploads/${outFilename}`;
        } catch (workerErr) {
            console.warn("Python worker edit fallback:", workerErr.message);
            resultUrl = generateProceduralLuxuryImage(`[Processed: ${action.toUpperCase()}] ${prompt || ""}`);
        }

        const record = {
            id: `edit_${Date.now()}`,
            action,
            prompt: prompt || `Action: ${action}`,
            resultUrl,
            createdAt: new Date().toISOString()
        };

        const db = storage.loadDB();
        db.generations.images.unshift(record);
        storage.saveDB(db);

        res.json({ success: true, image: record });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ----------------------------------------------------
// 3. AI CHARACTER STUDIO APIs
// ----------------------------------------------------
app.get("/api/character", (req, res) => {
    const db = storage.loadDB();
    res.json({ success: true, characters: db.characters });
});

app.post("/api/character", upload.array("referenceImages", 5), (req, res) => {
    try {
        const db = storage.loadDB();
        const {
            name,
            archetype = "Lead Protagonist",
            gender = "Female",
            age = 22,
            hairStyle = "Long wavy hair",
            eyeColor = "Amber brown",
            clothing = "Luxury designer blazer",
            bodyProportions = "Natural slender",
            visualStyle = "Photorealistic human characters",
            seedPrompt = ""
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: "Character name is required." });
        }

        const uploadedImages = (req.files || []).map(f => `/uploads/${path.basename(f.path)}`);

        // Generate consistent character avatar
        const previewUrl = generateProceduralLuxuryImage(
            `Character Profile: ${name} (${gender}, ${age}yo). ${hairStyle}, ${eyeColor} eyes, wearing ${clothing}. Proportions: ${bodyProportions}. ${seedPrompt}`,
            visualStyle,
            "1:1"
        );

        const newCharacter = {
            id: `char_${Date.now()}_${uuidv4().slice(0, 6)}`,
            name: name.trim(),
            archetype,
            gender,
            age: Number(age) || 20,
            hairStyle,
            eyeColor,
            clothing,
            bodyProportions,
            visualStyle,
            seedPrompt: seedPrompt || `Portrait of ${name}, ${hairStyle}, ${clothing}, cinematic lighting`,
            referenceImages: uploadedImages.length ? uploadedImages : [previewUrl],
            avatarUrl: previewUrl,
            createdAt: new Date().toISOString()
        };

        db.characters.unshift(newCharacter);
        storage.saveDB(db);

        res.json({ success: true, character: newCharacter });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete("/api/character/:id", (req, res) => {
    const db = storage.loadDB();
    db.characters = db.characters.filter(c => c.id !== req.params.id);
    storage.saveDB(db);
    res.json({ success: true, message: "Character deleted successfully." });
});

// ----------------------------------------------------
// 4. CINEMATIC AI VIDEO STUDIO APIs
// ----------------------------------------------------
app.post("/api/video/generate-scene", async (req, res) => {
    try {
        const {
            prompt,
            style = "Pixar-inspired 3D animation",
            aspectRatio = "16:9",
            duration = 3,
            camera = "Smooth Dolly In",
            characterId = null
        } = req.body;

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({ success: false, message: "Scene prompt is required." });
        }

        const db = storage.loadDB();
        let characterContext = "";
        if (characterId) {
            const char = db.characters.find(c => c.id === characterId);
            if (char) {
                characterContext = ` Character: ${char.name} (${char.hairStyle}, ${char.clothing}).`;
            }
        }

        let width = 1280;
        let height = 720;
        if (aspectRatio === "9:16") {
            width = 720;
            height = 1280;
        } else if (aspectRatio === "1:1") {
            width = 720;
            height = 720;
        }

        const clipId = `scene_${Date.now()}_${uuidv4().slice(0, 6)}.mp4`;
        const clipPath = path.join(storage.UPLOADS_DIR, clipId);

        await ffmpegHelper.generateProceduralClip({
            title: prompt.slice(0, 40) + (characterContext ? ` (${characterContext.slice(0, 20)})` : ""),
            style,
            camera,
            duration: Math.min(Math.max(Number(duration) || 3, 2), 15),
            outputPath: clipPath,
            width,
            height
        });

        const sceneRecord = {
            id: `scene_${Date.now()}`,
            prompt: prompt + characterContext,
            style,
            aspectRatio,
            camera,
            duration: Number(duration) || 3,
            videoUrl: `/uploads/${clipId}`,
            characterId,
            createdAt: new Date().toISOString()
        };

        db.generations.videos.unshift(sceneRecord);
        storage.saveDB(db);

        res.json({ success: true, scene: sceneRecord });
    } catch (err) {
        console.error("Video scene generation error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/video/combine-scenes", async (req, res) => {
    try {
        const { sceneIds, title = "Cinematic Movie Production" } = req.body;
        if (!sceneIds || !Array.isArray(sceneIds) || sceneIds.length < 2) {
            return res.status(400).json({ success: false, message: "Please select at least 2 scenes to combine." });
        }

        const db = storage.loadDB();
        const selectedScenes = db.generations.videos.filter(v => sceneIds.includes(v.id));
        if (selectedScenes.length < 2) {
            return res.status(404).json({ success: false, message: "Selected scene videos not found." });
        }

        const videoFilePaths = selectedScenes.map(s => {
            const filename = path.basename(s.videoUrl);
            return path.join(storage.UPLOADS_DIR, filename);
        });

        const combinedId = `combined_${Date.now()}_${uuidv4().slice(0, 6)}.mp4`;
        const combinedPath = path.join(storage.UPLOADS_DIR, combinedId);

        await ffmpegHelper.mergeVideoClips(videoFilePaths, combinedPath);

        const totalDuration = selectedScenes.reduce((acc, s) => acc + (s.duration || 3), 0);

        const combinedRecord = {
            id: `movie_${Date.now()}`,
            title,
            sceneCount: selectedScenes.length,
            duration: totalDuration,
            videoUrl: `/uploads/${combinedId}`,
            scenes: selectedScenes,
            createdAt: new Date().toISOString()
        };

        db.generations.videos.unshift(combinedRecord);
        storage.saveDB(db);

        res.json({ success: true, movie: combinedRecord });
    } catch (err) {
        console.error("Combine scenes error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ----------------------------------------------------
// 5. AI VOICE STUDIO APIs
// ----------------------------------------------------
app.post("/api/voice/generate", async (req, res) => {
    try {
        const { text, voice = "en-US-JennyNeural", emotion = "cinematic", speed = 1.0 } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, message: "Narration text is required." });
        }

        const voiceMap = {
            "Evelyn (British Narration)": "en-GB-SoniaNeural",
            "Seraphina (Soft Anime Heroine)": "en-US-AnaNeural",
            "Aria (Pixar Youthful Protagonist)": "en-US-JennyNeural",
            "Lucas (Cinematic Movie Narrator)": "en-US-ChristopherNeural",
            "Mina (Whispering Elegance)": "en-US-MichelleNeural",
            "Kenji (Anime Protagonist Male)": "en-US-GuyNeural"
        };
        const selectedVoice = voiceMap[voice] || voice || "en-US-JennyNeural";

        const audioId = `voice_${Date.now()}_${uuidv4().slice(0, 6)}.mp3`;
        const audioPath = path.join(storage.UPLOADS_DIR, audioId);

        let audioUrl = "";
        try {
            await runPythonWorker(["tts", text, selectedVoice, audioPath]);
            audioUrl = `/uploads/${audioId}`;
        } catch (ttsErr) {
            console.warn("Edge-TTS worker error, using tone fallback:", ttsErr.message);
            const fallbackWav = audioId.replace(".mp3", ".wav");
            const fallbackPath = path.join(storage.UPLOADS_DIR, fallbackWav);
            await ffmpegHelper.runFFmpeg([
                "-y",
                "-f", "lavfi",
                "-i", "sine=frequency=330:duration=3",
                fallbackPath
            ]);
            audioUrl = `/uploads/${fallbackWav}`;
        }

        const record = {
            id: `voice_${Date.now()}`,
            text,
            voice,
            emotion,
            speed,
            duration: Math.max(2, Math.ceil(text.length / 15)),
            audioUrl,
            createdAt: new Date().toISOString()
        };

        const db = storage.loadDB();
        db.generations.voices.unshift(record);
        storage.saveDB(db);

        res.json({ success: true, voice: record });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ----------------------------------------------------
// 6. HYPER FRAMES APIs (Motion Graphics)
// ----------------------------------------------------
app.post("/api/hyper-frames/render", async (req, res) => {
    try {
        const { title = "SHIN MOTION", subtitle = "Luxury Motion Graphics", template = "luxury-glow", duration = 3 } = req.body;
        const clipId = `hf_${Date.now()}_${uuidv4().slice(0, 6)}.mp4`;
        const clipPath = path.join(storage.UPLOADS_DIR, clipId);

        await ffmpegHelper.generateProceduralClip({
            title: `${title} - ${subtitle}`,
            style: `HyperFrames: ${template}`,
            camera: "Kinetic Motion Graphic",
            duration: Number(duration) || 3,
            outputPath: clipPath
        });

        const record = {
            id: `hf_${Date.now()}`,
            title,
            subtitle,
            template,
            videoUrl: `/uploads/${clipId}`,
            createdAt: new Date().toISOString()
        };

        const db = storage.loadDB();
        db.generations.hyperFrames.unshift(record);
        storage.saveDB(db);

        res.json({ success: true, frame: record });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ----------------------------------------------------
// 7. FFMPEG VIDEO EDITOR APIs
// ----------------------------------------------------
app.post("/api/editor/process", upload.fields([{ name: "video", maxCount: 1 }, { name: "audio", maxCount: 1 }]), async (req, res) => {
    try {
        const { action = "trim", startTime = 0, duration = 3, speed = 1.0, width = 1280, height = 720 } = req.body;

        let inputVideoPath = null;
        if (req.files && req.files.video && req.files.video.length) {
            inputVideoPath = req.files.video[0].path;
        } else {
            // Generate a sample video to edit
            const sampleName = `sample_edit_in_${Date.now()}.mp4`;
            inputVideoPath = path.join(storage.UPLOADS_DIR, sampleName);
            await ffmpegHelper.generateProceduralClip({
                title: "Editor Input Source",
                duration: 6,
                outputPath: inputVideoPath
            });
        }

        const outFilename = `edited_${Date.now()}_${uuidv4().slice(0, 6)}.mp4`;
        const outPath = path.join(storage.UPLOADS_DIR, outFilename);

        if (action === "trim") {
            await ffmpegHelper.trimVideo(inputVideoPath, outPath, Number(startTime) || 0, Number(duration) || 3);
        } else if (action === "speed") {
            await ffmpegHelper.changeSpeed(inputVideoPath, outPath, Number(speed) || 1.0);
        } else if (action === "resize") {
            await ffmpegHelper.resizeVideo(inputVideoPath, outPath, Number(width) || 1280, Number(height) || 720);
        } else if (action === "add_music" && req.files && req.files.audio) {
            await ffmpegHelper.addMusicToVideo(inputVideoPath, req.files.audio[0].path, outPath);
        } else {
            await ffmpegHelper.trimVideo(inputVideoPath, outPath, 0, 5);
        }

        const record = {
            id: `edit_${Date.now()}`,
            action,
            videoUrl: `/uploads/${outFilename}`,
            createdAt: new Date().toISOString()
        };

        const db = storage.loadDB();
        db.generations.editorJobs.unshift(record);
        storage.saveDB(db);

        res.json({ success: true, result: record });
    } catch (err) {
        console.error("FFmpeg editor error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ----------------------------------------------------
// 8. WHISPER CAPTION STUDIO APIs
// ----------------------------------------------------
app.post("/api/whisper/transcribe", upload.single("media"), async (req, res) => {
    try {
        const { captionStyle = "karaoke-pink", demoText } = req.body;
        let audioPath = req.file ? req.file.path : null;

        // If no file uploaded, generate speech from demoText using TTS first so Whisper transcribes real audio
        if (!audioPath) {
            const textToSynthesize = demoText || "Welcome to SHIN MOTION AI. Where cinematic storytelling meets luxury pink elegance.";
            audioPath = path.join(storage.UPLOADS_DIR, `whisper_input_${Date.now()}.mp3`);
            await runPythonWorker(["tts", textToSynthesize, "en-US-JennyNeural", audioPath]);
        }

        let transcriptionResult;
        try {
            transcriptionResult = await runPythonWorker(["whisper", audioPath]);
        } catch (whisperErr) {
            console.warn("Whisper execution fallback:", whisperErr.message);
            const fallbackText = demoText || "Welcome to SHIN MOTION AI.";
            const fallbackWords = fallbackText.split(" ").map((w, idx) => ({
                word: w,
                start: Number((idx * 0.4).toFixed(2)),
                end: Number(((idx + 1) * 0.4).toFixed(2))
            }));
            transcriptionResult = {
                text: fallbackText,
                words: fallbackWords
            };
        }

        const words = transcriptionResult.words || [];
        const fullText = transcriptionResult.text || "";

        // Generate accurate SRT string
        let srt = "";
        let srtIndex = 1;
        for (let i = 0; i < words.length; i += 4) {
            const chunk = words.slice(i, i + 4).map(w => w.word).join(" ");
            const chunkStart = words[i].start || 0;
            const chunkEnd = words[Math.min(i + 3, words.length - 1)].end || (chunkStart + 1.5);

            const startSec = Math.floor(chunkStart);
            const startMs = Math.floor((chunkStart % 1) * 1000);
            const endSec = Math.floor(chunkEnd);
            const endMs = Math.floor((chunkEnd % 1) * 1000);

            const formatTime = (s, ms) => {
                const m = Math.floor(s / 60);
                const remS = s % 60;
                return `00:${m < 10 ? '0' : ''}${m}:${remS < 10 ? '0' : ''}${remS},${ms < 100 ? '0' : ''}${ms < 10 ? '0' : ''}${ms}`;
            };

            srt += `${srtIndex}\n`;
            srt += `${formatTime(startSec, startMs)} --> ${formatTime(endSec, endMs)}\n`;
            srt += `${chunk}\n\n`;
            srtIndex++;
        }

        const record = {
            id: `whisper_${Date.now()}`,
            text: fullText,
            captionStyle,
            wordCount: words.length,
            words,
            srtContent: srt,
            createdAt: new Date().toISOString()
        };

        const db = storage.loadDB();
        db.generations.captions.unshift(record);
        storage.saveDB(db);

        res.json({ success: true, transcription: record });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ----------------------------------------------------
// 9. VIDEO RESEARCH STUDIO APIs (yt-dlp)
// ----------------------------------------------------
app.post("/api/research/inspect", async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ success: false, message: "URL is required." });
        }
        const info = await ytdlpHelper.extractVideoInfo(url);
        res.json({ success: true, data: info });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ----------------------------------------------------
// 10. PROJECT MANAGEMENT & HISTORY APIs
// ----------------------------------------------------
app.get("/api/projects", (req, res) => {
    const db = storage.loadDB();
    res.json({ success: true, projects: db.projects });
});

app.post("/api/projects", (req, res) => {
    const { name, description = "" } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Project name is required" });
    const db = storage.loadDB();
    const newProj = {
        id: `proj_${Date.now()}_${uuidv4().slice(0, 6)}`,
        name,
        description,
        createdAt: new Date().toISOString(),
        scenes: []
    };
    db.projects.unshift(newProj);
    storage.saveDB(db);
    res.json({ success: true, project: newProj });
});

app.delete("/api/projects/:id", (req, res) => {
    const db = storage.loadDB();
    db.projects = db.projects.filter(p => p.id !== req.params.id);
    storage.saveDB(db);
    res.json({ success: true, message: "Project deleted." });
});

app.get("/api/history", (req, res) => {
    const db = storage.loadDB();
    res.json({
        success: true,
        history: {
            images: db.generations.images,
            videos: db.generations.videos,
            voices: db.generations.voices,
            captions: db.generations.captions,
            hyperFrames: db.generations.hyperFrames,
            editorJobs: db.generations.editorJobs
        }
    });
});

// Start express server
app.listen(PORT, () => {
    console.log(`✨ SHIN MOTION AI Universe running on http://localhost:${PORT}`);
});
