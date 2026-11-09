const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const UPLOADS_DIR = path.join(__dirname, "uploads");
const DB_PATH = path.join(DATA_DIR, "db.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const INITIAL_DB = {
    settings: {
        hfToken: process.env.HF_TOKEN || "",
        defaultImageModel: "black-forest-labs/FLUX.1-schnell",
        defaultVideoModel: "damo-vilab/modelscope-damovip-text-to-video-synthesis",
        brand: "SHIN MOTION AI",
        theme: "luxury-baby-pink"
    },
    projects: [
        {
            id: "proj_sakura_blossom",
            name: "Sakura Blossom Story",
            description: "A cinematic romantic story set in Neo Tokyo spring blossoms.",
            createdAt: new Date().toISOString(),
            scenes: []
        }
    ],
    characters: [
        {
            id: "char_sakura_shin",
            name: "Sakura Shin",
            archetype: "Lead Protagonist",
            gender: "Female",
            age: 22,
            hairStyle: "Long silky blush-pink hair with loose waves",
            eyeColor: "Rose quartz brown",
            clothing: "Luxury tailored rose blazer with satin lapels",
            bodyProportions: "Graceful slender cinematic proportions",
            visualStyle: "Photorealistic human character",
            seedPrompt: "A hyper-detailed portrait of Sakura Shin, realistic skin textures, gentle natural smile, luxury blush blazer, soft depth of field",
            referenceImages: [],
            avatarUrl: "",
            createdAt: new Date().toISOString()
        },
        {
            id: "char_lumi_dreamer",
            name: "Lumi The Dreamer",
            archetype: "Hero Companion",
            gender: "Female",
            age: 12,
            hairStyle: "Pixar soft volumetric chestnut bob",
            eyeColor: "Vibrant emerald green",
            clothing: "Cozy oversized pastel cardigan with enamel pins",
            bodyProportions: "Pixar 3D stylized expressive",
            visualStyle: "Pixar-inspired 3D animation",
            seedPrompt: "Pixar 3D animation render of Lumi The Dreamer, charming expressive eyes, soft subsurface scattering skin, cinematic lighting",
            referenceImages: [],
            avatarUrl: "",
            createdAt: new Date().toISOString()
        }
    ],
    generations: {
        images: [],
        videos: [],
        voices: [],
        captions: [],
        hyperFrames: [],
        editorJobs: []
    }
};

function loadDB() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DB, null, 2), "utf8");
            return INITIAL_DB;
        }
        const data = fs.readFileSync(DB_PATH, "utf8");
        return JSON.parse(data);
    } catch (err) {
        console.error("Storage load error:", err);
        return INITIAL_DB;
    }
}

function saveDB(db) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
        return true;
    } catch (err) {
        console.error("Storage save error:", err);
        return false;
    }
}

module.exports = {
    DATA_DIR,
    UPLOADS_DIR,
    DB_PATH,
    loadDB,
    saveDB
};
