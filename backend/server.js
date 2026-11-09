const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { InferenceClient } = require("@huggingface/inference");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.HF_TOKEN) {
    console.error("HF_TOKEN is missing from .env file");
    process.exit(1);
}

const hf = new InferenceClient(process.env.HF_TOKEN);

app.use(cors());
app.use(express.json({ limit: "20mb" }));

// Website
app.use(express.static(path.join(__dirname, "../public")));

// Backend status
app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        message: "DreamMotion AI backend is running!",
        imageGeneration: "Ready"
    });
});

// AI Image Generation
app.post("/api/generate-image", async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter a prompt."
            });
        }

        console.log("Generating image:", prompt);

        const image = await hf.textToImage({
    model: "black-forest-labs/FLUX.1-schnell",
    inputs: prompt
});

        const buffer = Buffer.from(await image.arrayBuffer());

        res.json({
            success: true,
            image: `data:image/png;base64,${buffer.toString("base64")}`
        });

    } catch (error) {
        console.error("Image generation error:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Image generation failed."
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`DreamMotion AI running at http://localhost:${PORT}`);
});