/**
 * SHIN MOTION AI 🎀
 * Frontend Application Controller for all 10 Studios
 */

const state = {
    currentStudio: "dashboard",
    activeProjectId: "proj_sakura_blossom",
    activeProjectName: "Sakura Blossom Story",
    settings: {},
    characters: [],
    history: {
        images: [],
        videos: [],
        voices: [],
        captions: [],
        hyperFrames: [],
        editorJobs: []
    }
};

// Studio renderers mapping
const studioRenderers = {
    dashboard: renderDashboardStudio,
    image: renderImageStudio,
    video: renderVideoStudio,
    character: renderCharacterStudio,
    voice: renderVoiceStudio,
    hyperframes: renderHyperFramesStudio,
    editor: renderEditorStudio,
    whisper: renderWhisperStudio,
    research: renderResearchStudio,
    projects: renderProjectsStudio,
    history: renderHistoryStudio
};

// Initialize Application
document.addEventListener("DOMContentLoaded", async () => {
    initNavigation();
    initSettingsModal();
    await fetchStatusAndSettings();
    await fetchCharacters();
    navigateStudio("dashboard");
});

function initNavigation() {
    const navButtons = document.querySelectorAll(".studio-nav-btn");
    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const studio = btn.getAttribute("data-studio");
            if (studio) {
                navigateStudio(studio);
            }
        });
    });
}

function navigateStudio(studioName) {
    state.currentStudio = studioName;
    document.querySelectorAll(".studio-nav-btn").forEach(btn => {
        if (btn.getAttribute("data-studio") === studioName) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    const mainArea = document.getElementById("mainContentArea");
    mainArea.innerHTML = "";
    if (studioRenderers[studioName]) {
        studioRenderers[studioName](mainArea);
    }
}

async function fetchStatusAndSettings() {
    try {
        const res = await fetch("/api/status");
        const data = await res.json();
        if (data.success) {
            state.settings = data.settings || {};
            if (document.getElementById("hfTokenInput")) {
                document.getElementById("hfTokenInput").value = state.settings.hfToken || "";
            }
            if (document.getElementById("defaultImageModelInput")) {
                document.getElementById("defaultImageModelInput").value = state.settings.defaultImageModel || "black-forest-labs/FLUX.1-schnell";
            }
        }
    } catch (e) {
        console.warn("Status fetch failed:", e);
    }
}

async function fetchCharacters() {
    try {
        const res = await fetch("/api/character");
        const data = await res.json();
        if (data.success) {
            state.characters = data.characters || [];
        }
    } catch (e) {
        console.warn("Character fetch failed:", e);
    }
}

function initSettingsModal() {
    const modal = document.getElementById("settingsModal");
    const openBtn = document.getElementById("openSettingsModalBtn");
    const closeBtn = document.getElementById("closeSettingsModalBtn");
    const saveBtn = document.getElementById("saveSettingsBtn");

    if (openBtn) openBtn.onclick = () => modal.classList.remove("hidden");
    if (closeBtn) closeBtn.onclick = () => modal.classList.add("hidden");
    if (saveBtn) {
        saveBtn.onclick = async () => {
            const token = document.getElementById("hfTokenInput").value;
            const model = document.getElementById("defaultImageModelInput").value;
            try {
                const res = await fetch("/api/settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ hfToken: token, defaultImageModel: model })
                });
                const data = await res.json();
                if (data.success) {
                    alert("Settings saved successfully!");
                    modal.classList.add("hidden");
                }
            } catch (err) {
                alert("Error saving settings: " + err.message);
            }
        };
    }
}

// -------------------------------------------------------------------------
// 1. DASHBOARD OVERVIEW STUDIO
// -------------------------------------------------------------------------
function renderDashboardStudio(container) {
    container.innerHTML = `
        <div class="max-w-6xl mx-auto space-y-8">
            <!-- Hero Luxury Banner -->
            <div class="bg-gradient-to-r from-shin-black via-shin-charcoal to-shin-black rounded-3xl p-8 md:p-12 text-white border border-shin-border shadow-xl relative overflow-hidden">
                <div class="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-shin-rose/20 blur-3xl pointer-events-none"></div>
                <div class="relative z-10 max-w-2xl space-y-4">
                    <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-shin-rose/20 text-shin-pink text-xs font-semibold tracking-wider uppercase border border-shin-rose/30">
                        <i class="fa-solid fa-sparkles"></i> Next-Gen Cinematic AI Production
                    </span>
                    <h2 class="font-serif text-3xl md:text-5xl font-bold leading-tight text-white">
                        Create Masterpiece AI Films, Characters & Motion Graphics
                    </h2>
                    <p class="text-sm md:text-base text-gray-300 font-light">
                        SHIN MOTION AI combines FLUX.1 Schnell generation, Netflix-grade video direction, consistent character memory, neural voice synthesis, and cloud FFmpeg video post-production in an elegant luxury workflow.
                    </p>
                    <div class="pt-2 flex flex-wrap gap-4">
                        <button onclick="navigateStudio('video')" class="luxury-btn px-6 py-3 rounded-2xl text-sm flex items-center gap-2 shadow-lg">
                            <i class="fa-solid fa-clapperboard"></i> Open Cinematic Video Studio
                        </button>
                        <button onclick="navigateStudio('character')" class="px-6 py-3 rounded-2xl text-sm font-semibold bg-white/10 hover:bg-white/20 text-white transition border border-white/20 flex items-center gap-2">
                            <i class="fa-solid fa-user-astronaut"></i> Create Recurring Character
                        </button>
                    </div>
                </div>
            </div>

            <!-- Studios Quick Launch Grid -->
            <div>
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-serif font-bold text-xl text-shin-charcoal">SHIN MOTION Creative Studios</h3>
                    <span class="text-xs text-shin-darkRose font-bold">10 Dedicated Creative Engines</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    ${createStudioCard("image", "AI Image Studio", "FLUX.1 Schnell, photorealistic people, anime & background removal.", "fa-wand-magic-sparkles")}
                    ${createStudioCard("video", "AI Video Studio", "Pixar 3D, Japanese anime, camera movements & scene stitching.", "fa-clapperboard")}
                    ${createStudioCard("character", "AI Character Studio", "Consistent faces, hairstyles, outfits & recurring cast profiles.", "fa-user-astronaut")}
                    ${createStudioCard("voice", "AI Voice Studio", "Story narration, character dialogues, multi-voice personas.", "fa-microphone-lines")}
                    ${createStudioCard("hyperframes", "Hyper Frames", "Motion graphics, animated typography, intro/outro templates.", "fa-bolt")}
                    ${createStudioCard("editor", "FFmpeg Video Editor", "Trim, cut, resize, adjust speed, and mix background audio.", "fa-scissors")}
                    ${createStudioCard("whisper", "Whisper Captions", "Word-level aligned karaoke captions & instant SRT export.", "fa-closed-captioning")}
                    ${createStudioCard("research", "Video Research", "Inspect authorised URLs, extract metadata, structure & audio.", "fa-magnifying-glass-chart")}
                </div>
            </div>

            <!-- Active Recurring Characters Section -->
            <div class="luxury-card p-6 rounded-3xl">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-serif font-bold text-lg text-shin-charcoal">Active Recurring Characters</h3>
                    <button onclick="navigateStudio('character')" class="text-xs text-shin-darkRose font-semibold hover:underline">
                        Manage Cast →
                    </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4" id="dashboardCharacterPreview">
                    ${renderCharacterCardsHtml()}
                </div>
            </div>
        </div>
    `;
}

function createStudioCard(studioKey, title, desc, iconClass) {
    return `
        <div onclick="navigateStudio('${studioKey}')" class="luxury-card p-5 rounded-2xl cursor-pointer group flex flex-col justify-between">
            <div>
                <div class="w-10 h-10 rounded-xl bg-shin-pink text-shin-darkRose flex items-center justify-center text-lg mb-3 group-hover:scale-110 transition duration-300">
                    <i class="fa-solid ${iconClass}"></i>
                </div>
                <h4 class="font-bold text-sm text-shin-charcoal group-hover:text-shin-darkRose transition">${title}</h4>
                <p class="text-xs text-gray-500 mt-1 leading-relaxed">${desc}</p>
            </div>
            <div class="pt-3 mt-2 border-t border-shin-pink/50 text-xs font-semibold text-shin-darkRose flex items-center justify-between">
                <span>Launch Studio</span>
                <i class="fa-solid fa-arrow-right text-[10px] transform group-hover:translate-x-1 transition"></i>
            </div>
        </div>
    `;
}

function renderCharacterCardsHtml() {
    if (!state.characters.length) {
        return `<p class="text-xs text-gray-400 col-span-3">No characters saved yet. Create your first recurring character in the AI Character Studio.</p>`;
    }
    return state.characters.map(char => `
        <div class="bg-shin-blush/60 p-3.5 rounded-2xl border border-shin-rose/20 flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-shin-black text-white flex items-center justify-center font-bold text-base overflow-hidden">
                ${char.avatarUrl ? `<img src="${char.avatarUrl}" class="w-full h-full object-cover">` : char.name.slice(0, 2).toUpperCase()}
            </div>
            <div class="overflow-hidden">
                <h5 class="text-xs font-bold text-shin-charcoal truncate">${char.name}</h5>
                <p class="text-[11px] text-shin-darkRose font-medium">${char.visualStyle}</p>
                <p class="text-[10px] text-gray-500 truncate">${char.hairStyle}</p>
            </div>
        </div>
    `).join("");
}

// -------------------------------------------------------------------------
// 2. AI IMAGE STUDIO
// -------------------------------------------------------------------------
function renderImageStudio(container) {
    container.innerHTML = `
        <div class="max-w-5xl mx-auto space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="font-serif text-2xl font-bold text-shin-charcoal">AI Image Studio</h2>
                    <p class="text-xs text-gray-500">Text-to-Image, AI Background Editing, Enhancement & Photo Generation</p>
                </div>
                <div class="flex gap-2">
                    <span class="text-xs bg-shin-pink text-shin-darkRose px-3 py-1 rounded-full font-semibold border border-shin-rose/30">
                        FLUX.1 Schnell & Procedural Luxe
                    </span>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Controls Column -->
                <div class="luxury-card p-6 rounded-3xl space-y-4">
                    <div>
                        <label class="block text-xs font-bold uppercase text-gray-600 mb-1">Visual Prompt</label>
                        <textarea id="imagePromptInput" rows="4" placeholder="Portrait of a luxury fashion model in pastel blush silk dress, natural lighting, ultra sharp details..." class="w-full p-3.5 rounded-2xl border border-shin-border focus:border-shin-rose focus:outline-none text-sm bg-shin-blush/20 resize-none"></textarea>
                    </div>

                    <div class="space-y-3">
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 mb-1">AI Image Model</label>
                            <select id="imageModelSelect" class="w-full p-2.5 rounded-xl border border-shin-border text-xs bg-white">
                                <option value="black-forest-labs/FLUX.1-schnell">black-forest-labs/FLUX.1-schnell (FLUX)</option>
                                <option value="stabilityai/stable-diffusion-xl-base-1.0">stabilityai/stable-diffusion-xl-base-1.0 (SDXL)</option>
                                <option value="runwayml/stable-diffusion-v1-5">runwayml/stable-diffusion-v1-5 (SD 1.5)</option>
                            </select>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 mb-1">Artistic Style</label>
                                <select id="imageStyleSelect" class="w-full p-2.5 rounded-xl border border-shin-border text-xs bg-white">
                                    <option>Photorealistic human characters</option>
                                    <option>Pixar-inspired 3D animation</option>
                                    <option>Japanese anime movie style</option>
                                    <option>Cinematic animated storytelling</option>
                                    <option>Realistic romantic movie scenes</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 mb-1">Aspect Ratio</label>
                                <select id="imageAspectSelect" class="w-full p-2.5 rounded-xl border border-shin-border text-xs bg-white">
                                    <option value="16:9">16:9 (Cinematic)</option>
                                    <option value="9:16">9:16 (Stories/Reels)</option>
                                    <option value="1:1">1:1 (Square)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <button id="generateImageBtn" class="luxury-btn w-full py-3 rounded-2xl text-sm flex items-center justify-center gap-2">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> Generate Image
                    </button>

                    <!-- AI Photo Editing Actions -->
                    <div class="pt-4 border-t border-shin-border space-y-3">
                        <span class="text-[11px] font-bold uppercase tracking-wider text-gray-500">AI Photo Operations</span>
                        <div class="grid grid-cols-3 gap-2">
                            <button onclick="applyImageEdit('remove-bg')" class="p-2 rounded-xl bg-shin-blush text-shin-darkRose text-xs font-semibold hover:bg-shin-pink transition">
                                RemBg
                            </button>
                            <button onclick="applyImageEdit('replace-bg')" class="p-2 rounded-xl bg-shin-blush text-shin-darkRose text-xs font-semibold hover:bg-shin-pink transition">
                                Luxe Pink BG
                            </button>
                            <button onclick="applyImageEdit('enhance')" class="p-2 rounded-xl bg-shin-blush text-shin-darkRose text-xs font-semibold hover:bg-shin-pink transition">
                                Enhance 4K
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Preview Column -->
                <div class="lg:col-span-2 luxury-card p-6 rounded-3xl flex flex-col justify-between items-center">
                    <div class="w-full flex items-center justify-between mb-3">
                        <h4 class="font-bold text-sm text-shin-charcoal">Studio Canvas Output</h4>
                        <span id="imageStatusBadge" class="text-xs text-gray-400">Ready</span>
                    </div>

                    <div id="imagePreviewContainer" class="w-full h-80 rounded-2xl bg-shin-blush/50 border border-dashed border-shin-border flex items-center justify-center overflow-hidden relative">
                        <div class="text-center p-6 space-y-2 text-gray-400">
                            <i class="fa-regular fa-image text-4xl text-shin-rose/50"></i>
                            <p class="text-xs">Your generated image preview will appear here in ultra-high fidelity.</p>
                        </div>
                    </div>

                    <div class="w-full pt-4 flex justify-between items-center text-xs text-gray-500">
                        <span id="imageMetaText">Model: FLUX.1 Schnell</span>
                        <a id="imageDownloadBtn" href="#" download="shin_motion_render.png" class="luxury-btn-dark px-4 py-2 rounded-xl text-xs font-semibold hidden flex items-center gap-2">
                            <i class="fa-solid fa-download"></i> Download HD
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById("generateImageBtn").onclick = async () => {
        const prompt = document.getElementById("imagePromptInput").value;
        const style = document.getElementById("imageStyleSelect").value;
        const aspectRatio = document.getElementById("imageAspectSelect").value;
        const model = document.getElementById("imageModelSelect").value;

        if (!prompt.trim()) return alert("Please enter an image prompt.");

        const badge = document.getElementById("imageStatusBadge");
        const imgContainer = document.getElementById("imagePreviewContainer");
        const dlBtn = document.getElementById("imageDownloadBtn");

        badge.innerHTML = `<i class="fa-solid fa-spinner animate-spin text-shin-rose"></i> Generating AI Image...`;

        try {
            const res = await fetch("/api/image/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, style, aspectRatio, model })
            });
            const data = await res.json();

            if (data.success && data.image) {
                imgContainer.innerHTML = `
                    <img src="${data.image.imageUrl}" alt="${prompt}" class="w-full h-full object-contain rounded-xl shadow-inner">
                `;
                dlBtn.href = data.image.imageUrl;
                dlBtn.classList.remove("hidden");
                badge.innerHTML = `<span class="text-emerald-600 font-bold"><i class="fa-solid fa-check"></i> Generated</span>`;
                document.getElementById("imageMetaText").innerText = `Model: ${data.image.model || model} • ${style}`;
            } else {
                badge.innerHTML = `<span class="text-red-500 font-bold"><i class="fa-solid fa-circle-exclamation"></i> Failed</span>`;
                imgContainer.innerHTML = `
                    <div class="text-left p-6 space-y-3 max-w-md bg-white/90 rounded-2xl border border-red-200 shadow-sm">
                        <div class="flex items-center gap-2 text-red-600 font-bold text-sm">
                            <i class="fa-solid fa-circle-xmark text-base"></i>
                            <span>Generation Unsuccessful</span>
                        </div>
                        <p class="text-xs text-gray-700 leading-relaxed">${data.message || "Could not generate image."}</p>
                        ${data.requiresToken ? `
                            <button onclick="document.getElementById('openSettingsModalBtn').click()" class="luxury-btn text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                <i class="fa-solid fa-gear"></i> Open Engine Settings
                            </button>
                        ` : `
                            <p class="text-[11px] text-gray-500">Check model access or verify your Hugging Face token in Engine Settings.</p>
                        `}
                    </div>
                `;
            }
        } catch (err) {
            badge.innerHTML = `<span class="text-red-500 font-bold">Error</span>`;
            imgContainer.innerHTML = `
                <div class="text-center p-6 space-y-2 text-red-600">
                    <i class="fa-solid fa-triangle-exclamation text-3xl"></i>
                    <p class="text-xs font-semibold">Network or server error: ${err.message}</p>
                </div>
            `;
        }
    };
}

window.applyImageEdit = async function(action) {
    const prompt = document.getElementById("imagePromptInput").value || "Editorial Luxe Portrait";
    const badge = document.getElementById("imageStatusBadge");
    badge.innerHTML = `<i class="fa-solid fa-spinner animate-spin text-shin-rose"></i> Processing ${action}...`;

    try {
        const res = await fetch("/api/image/edit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, prompt, color: "#FFE4E9" })
        });
        const data = await res.json();
        if (data.success) {
            const imgContainer = document.getElementById("imagePreviewContainer");
            imgContainer.innerHTML = `<img src="${data.image.resultUrl}" class="w-full h-full object-contain rounded-xl">`;
            badge.innerText = `Edit: ${action} applied`;
        }
    } catch (e) {
        badge.innerText = "Edit error";
        alert(e.message);
    }
};

// -------------------------------------------------------------------------
// 3. CINEMATIC AI VIDEO STUDIO 🎬
// -------------------------------------------------------------------------
let videoScenesQueue = [];

function renderVideoStudio(container) {
    container.innerHTML = `
        <div class="max-w-6xl mx-auto space-y-6">
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 class="font-serif text-2xl font-bold text-shin-charcoal flex items-center gap-2">
                        Cinematic AI Video Studio 🎬
                        <span class="text-xs bg-shin-rose text-white px-2.5 py-0.5 rounded-full font-bold">Netflix / Pixar Grade</span>
                    </h2>
                    <p class="text-xs text-gray-500">Multi-scene generation, camera controls, recurring character consistency & full-length movie concatenation.</p>
                </div>
                <button id="combineScenesBtn" class="luxury-btn px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2">
                    <i class="fa-solid fa-film"></i> Combine All Scenes into 1 Movie
                </button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Scene Configuration Form -->
                <div class="luxury-card p-6 rounded-3xl space-y-4">
                    <h4 class="font-bold text-sm text-shin-charcoal">Scene Director Panel</h4>

                    <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-1">Scene Narrative Prompt</label>
                        <textarea id="videoScenePrompt" rows="3" placeholder="Sakura walks through Neo Tokyo cherry blossom street, soft breeze moving her blush pink hair, cinematic dolly in..." class="w-full p-3 rounded-xl border border-shin-border text-xs resize-none"></textarea>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 mb-1">Visual Style</label>
                            <select id="videoStyleSelect" class="w-full p-2 rounded-xl border border-shin-border text-xs bg-white">
                                <option>Pixar-inspired 3D animation</option>
                                <option>Photorealistic human characters</option>
                                <option>Japanese anime movie style</option>
                                <option>Cinematic animated storytelling</option>
                                <option>Realistic romantic movie scenes</option>
                                <option>Fantasy and adventure movies</option>
                                <option>Professional commercial videos</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 mb-1">Camera Movement</label>
                            <select id="videoCameraSelect" class="w-full p-2 rounded-xl border border-shin-border text-xs bg-white">
                                <option>Smooth Dolly In</option>
                                <option>Cinematic Orbit Pan</option>
                                <option>Slow Crane Down</option>
                                <option>Dynamic Handheld Tracking</option>
                                <option>Static 4K Telephoto</option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 mb-1">Character Memory</label>
                            <select id="videoCharacterSelect" class="w-full p-2 rounded-xl border border-shin-border text-xs bg-white">
                                <option value="">No Recurring Character</option>
                                ${state.characters.map(c => `<option value="${c.id}">${c.name} (${c.archetype})</option>`).join("")}
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 mb-1">Scene Duration</label>
                            <select id="videoDurationSelect" class="w-full p-2 rounded-xl border border-shin-border text-xs bg-white">
                                <option value="3">3 Seconds</option>
                                <option value="5">5 Seconds</option>
                                <option value="8">8 Seconds</option>
                            </select>
                        </div>
                    </div>

                    <button id="renderSceneBtn" class="luxury-btn w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2">
                        <i class="fa-solid fa-video"></i> Render Cinematic Scene
                    </button>
                </div>

                <!-- Video Player Monitor -->
                <div class="lg:col-span-2 luxury-card p-6 rounded-3xl flex flex-col justify-between">
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="font-bold text-sm text-shin-charcoal">Cinematic Video Monitor</h4>
                        <span id="videoStatusBadge" class="text-xs text-gray-400">Ready</span>
                    </div>

                    <div id="videoMonitorArea" class="w-full h-80 rounded-2xl bg-shin-black flex items-center justify-center overflow-hidden border border-shin-border">
                        <div class="text-center text-gray-500 space-y-2">
                            <i class="fa-solid fa-film text-4xl text-shin-rose/40"></i>
                            <p class="text-xs">Rendered movie clip will stream here.</p>
                        </div>
                    </div>

                    <!-- Storyboard Scene Queue -->
                    <div class="pt-4 mt-4 border-t border-shin-border">
                        <span class="text-xs font-bold text-gray-600 uppercase tracking-wider">Storyboard Scene Queue (${videoScenesQueue.length} Scenes)</span>
                        <div class="flex gap-3 overflow-x-auto py-2" id="sceneQueueContainer">
                            ${renderSceneQueueCards()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById("renderSceneBtn").onclick = async () => {
        const prompt = document.getElementById("videoScenePrompt").value;
        const style = document.getElementById("videoStyleSelect").value;
        const camera = document.getElementById("videoCameraSelect").value;
        const characterId = document.getElementById("videoCharacterSelect").value || null;
        const duration = document.getElementById("videoDurationSelect").value;

        if (!prompt.trim()) return alert("Please specify a scene prompt.");

        const badge = document.getElementById("videoStatusBadge");
        badge.innerHTML = `<i class="fa-solid fa-spinner animate-spin text-shin-rose"></i> Rendering Scene...`;

        try {
            const res = await fetch("/api/video/generate-scene", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, style, camera, characterId, duration })
            });
            const data = await res.json();
            if (data.success) {
                videoScenesQueue.push(data.scene);
                const monitor = document.getElementById("videoMonitorArea");
                monitor.innerHTML = `<video controls autoplay class="w-full h-full object-contain"><source src="${data.scene.videoUrl}" type="video/mp4"></video>`;
                badge.innerText = "Scene Ready";
                document.getElementById("sceneQueueContainer").innerHTML = renderSceneQueueCards();
            } else {
                badge.innerText = "Error";
                alert(data.message || "Video rendering failed");
            }
        } catch (err) {
            badge.innerText = "Failed";
            alert("Error: " + err.message);
        }
    };

    document.getElementById("combineScenesBtn").onclick = async () => {
        if (videoScenesQueue.length < 2) {
            return alert("Please render at least 2 scenes into the queue before concatenating a movie.");
        }
        const badge = document.getElementById("videoStatusBadge");
        badge.innerHTML = `<i class="fa-solid fa-spinner animate-spin text-shin-rose"></i> Stitching Full Movie via FFmpeg...`;

        try {
            const res = await fetch("/api/video/combine-scenes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sceneIds: videoScenesQueue.map(s => s.id), title: "Complete Cinematic Production" })
            });
            const data = await res.json();
            if (data.success) {
                const monitor = document.getElementById("videoMonitorArea");
                monitor.innerHTML = `<video controls autoplay class="w-full h-full object-contain"><source src="${data.movie.videoUrl}" type="video/mp4"></video>`;
                badge.innerText = "Combined Movie Complete!";
                alert(`✨ Full movie successfully stitched (${data.movie.sceneCount} scenes, ${data.movie.duration}s)!`);
            } else {
                alert(data.message);
            }
        } catch (e) {
            alert(e.message);
        }
    };
}

function renderSceneQueueCards() {
    if (!videoScenesQueue.length) {
        return `<span class="text-xs text-gray-400">Queue is empty. Render scenes to build your movie sequence.</span>`;
    }
    return videoScenesQueue.map((s, idx) => `
        <div class="flex-shrink-0 w-36 bg-shin-blush p-2 rounded-xl border border-shin-rose/20 text-xs">
            <span class="font-bold text-shin-darkRose">Scene ${idx + 1} (${s.duration}s)</span>
            <p class="text-[11px] text-gray-600 truncate mt-1">${s.prompt}</p>
        </div>
    `).join("");
}

// -------------------------------------------------------------------------
// 4. AI CHARACTER STUDIO
// -------------------------------------------------------------------------
function renderCharacterStudio(container) {
    container.innerHTML = `
        <div class="max-w-6xl mx-auto space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="font-serif text-2xl font-bold text-shin-charcoal">AI Character Studio</h2>
                    <p class="text-xs text-gray-500">Create recurring personas with consistent facial structure, hairstyle, clothing and body proportions.</p>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Character Profile Creator -->
                <div class="luxury-card p-6 rounded-3xl space-y-4">
                    <h4 class="font-bold text-sm text-shin-charcoal">Build New Recurring Character</h4>

                    <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-1">Character Name</label>
                        <input id="charNameInput" type="text" placeholder="e.g., Sakura Shin" class="w-full p-2.5 rounded-xl border border-shin-border text-xs">
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 mb-1">Archetype</label>
                            <select id="charArchetypeSelect" class="w-full p-2 rounded-xl border border-shin-border text-xs bg-white">
                                <option>Lead Protagonist</option>
                                <option>Charming Companion</option>
                                <option>Mysterious Mentor</option>
                                <option>Luxury Fashion Icon</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 mb-1">Visual Style</label>
                            <select id="charStyleSelect" class="w-full p-2 rounded-xl border border-shin-border text-xs bg-white">
                                <option>Photorealistic human character</option>
                                <option>Pixar-inspired 3D animation</option>
                                <option>Japanese anime movie style</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-1">Hairstyle & Color</label>
                        <input id="charHairInput" type="text" placeholder="e.g., Long silky blush-pink waves with soft bangs" class="w-full p-2.5 rounded-xl border border-shin-border text-xs">
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-1">Signature Clothing & Wardrobe</label>
                        <input id="charClothingInput" type="text" placeholder="e.g., Tailored luxury satin blazer with pearl buttons" class="w-full p-2.5 rounded-xl border border-shin-border text-xs">
                    </div>

                    <button id="saveCharacterBtn" class="luxury-btn w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2">
                        <i class="fa-solid fa-floppy-disk"></i> Save Recurring Character
                    </button>
                </div>

                <!-- Cast Roster Display -->
                <div class="lg:col-span-2 luxury-card p-6 rounded-3xl">
                    <h4 class="font-bold text-sm text-shin-charcoal mb-4">Saved Recurring Cast (${state.characters.length})</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="castRosterGrid">
                        ${renderCastRosterHtml()}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById("saveCharacterBtn").onclick = async () => {
        const name = document.getElementById("charNameInput").value;
        const archetype = document.getElementById("charArchetypeSelect").value;
        const visualStyle = document.getElementById("charStyleSelect").value;
        const hairStyle = document.getElementById("charHairInput").value || "Soft pastel hair";
        const clothing = document.getElementById("charClothingInput").value || "Luxury tailored outfit";

        if (!name.trim()) return alert("Character name is required.");

        try {
            const res = await fetch("/api/character", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, archetype, visualStyle, hairStyle, clothing })
            });
            const data = await res.json();
            if (data.success) {
                state.characters.unshift(data.character);
                alert(`Character ${data.character.name} registered successfully!`);
                document.getElementById("castRosterGrid").innerHTML = renderCastRosterHtml();
            }
        } catch (e) {
            alert(e.message);
        }
    };
}

function renderCastRosterHtml() {
    if (!state.characters.length) {
        return `<p class="text-xs text-gray-400 col-span-2">No characters saved yet.</p>`;
    }
    return state.characters.map(c => `
        <div class="bg-shin-blush/60 p-4 rounded-2xl border border-shin-rose/20 flex gap-4">
            <div class="w-16 h-16 rounded-2xl bg-shin-black text-white flex-shrink-0 flex items-center justify-center font-bold text-lg overflow-hidden">
                ${c.avatarUrl ? `<img src="${c.avatarUrl}" class="w-full h-full object-cover">` : c.name.slice(0, 2).toUpperCase()}
            </div>
            <div class="overflow-hidden flex-1 space-y-1">
                <div class="flex items-center justify-between">
                    <h5 class="text-xs font-bold text-shin-charcoal truncate">${c.name}</h5>
                    <button onclick="deleteCharacter('${c.id}')" class="text-gray-400 hover:text-red-500 text-xs">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
                <p class="text-[11px] text-shin-darkRose font-semibold">${c.visualStyle}</p>
                <p class="text-[10px] text-gray-500 truncate"><b>Hair:</b> ${c.hairStyle}</p>
                <p class="text-[10px] text-gray-500 truncate"><b>Outfit:</b> ${c.clothing}</p>
            </div>
        </div>
    `).join("");
}

window.deleteCharacter = async function(id) {
    if (!confirm("Are you sure you want to delete this character?")) return;
    try {
        const res = await fetch(`/api/character/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
            state.characters = state.characters.filter(c => c.id !== id);
            document.getElementById("castRosterGrid").innerHTML = renderCastRosterHtml();
        }
    } catch (e) {
        alert(e.message);
    }
};

// -------------------------------------------------------------------------
// 5. AI VOICE STUDIO
// -------------------------------------------------------------------------
function renderVoiceStudio(container) {
    container.innerHTML = `
        <div class="max-w-4xl mx-auto space-y-6">
            <div>
                <h2 class="font-serif text-2xl font-bold text-shin-charcoal">AI Voice Studio</h2>
                <p class="text-xs text-gray-500">Text-to-Speech narrative synthesis, multi-voice selection, character dialogue and emotional inflection.</p>
            </div>

            <div class="luxury-card p-6 rounded-3xl space-y-4">
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Dialogue or Story Narration</label>
                    <textarea id="voiceTextInput" rows="4" placeholder="Neo Tokyo was quiet beneath the falling petals, yet in her heart, a new dream was taking flight..." class="w-full p-3 rounded-xl border border-shin-border text-xs resize-none"></textarea>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-1">Voice Personality</label>
                        <select id="voicePersonaSelect" class="w-full p-2.5 rounded-xl border border-shin-border text-xs bg-white">
                            <option>Evelyn (British Narration)</option>
                            <option>Seraphina (Soft Anime Heroine)</option>
                            <option>Aria (Pixar Youthful Protagonist)</option>
                            <option>Lucas (Cinematic Movie Narrator)</option>
                            <option>Mina (Whispering Elegance)</option>
                            <option>Kenji (Anime Protagonist Male)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-1">Emotion Preset</label>
                        <select id="voiceEmotionSelect" class="w-full p-2.5 rounded-xl border border-shin-border text-xs bg-white">
                            <option>Cinematic Dramatic</option>
                            <option>Gentle & Intimate</option>
                            <option>Playful Pixar Vibe</option>
                            <option>Commercial Warmth</option>
                        </select>
                    </div>
                </div>

                <button id="synthesizeVoiceBtn" class="luxury-btn w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2">
                    <i class="fa-solid fa-microphone-lines"></i> Synthesize AI Voice
                </button>

                <div id="voicePlaybackContainer" class="p-4 rounded-2xl bg-shin-blush/60 border border-shin-rose/20 hidden">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-bold text-shin-darkRose">Generated Audio Track</span>
                        <a id="voiceDownloadLink" href="#" download="narration.mp3" class="text-xs font-semibold text-shin-charcoal hover:underline">
                            <i class="fa-solid fa-download"></i> Download Audio
                        </a>
                    </div>
                    <audio id="voiceAudioPlayer" controls class="w-full"></audio>
                </div>
            </div>
        </div>
    `;

    document.getElementById("synthesizeVoiceBtn").onclick = async () => {
        const text = document.getElementById("voiceTextInput").value;
        const voice = document.getElementById("voicePersonaSelect").value;
        const emotion = document.getElementById("voiceEmotionSelect").value;

        if (!text.trim()) return alert("Please enter narration text.");

        try {
            const res = await fetch("/api/voice/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, voice, emotion })
            });
            const data = await res.json();
            if (data.success) {
                const container = document.getElementById("voicePlaybackContainer");
                container.classList.remove("hidden");
                const audio = document.getElementById("voiceAudioPlayer");
                audio.src = data.voice.audioUrl;
                document.getElementById("voiceDownloadLink").href = data.voice.audioUrl;
                audio.play();
            }
        } catch (e) {
            alert(e.message);
        }
    };
}

// -------------------------------------------------------------------------
// 6. HYPER FRAMES (Motion Graphics)
// -------------------------------------------------------------------------
function renderHyperFramesStudio(container) {
    container.innerHTML = `
        <div class="max-w-4xl mx-auto space-y-6">
            <div>
                <h2 class="font-serif text-2xl font-bold text-shin-charcoal">Hyper Frames Motion Graphics</h2>
                <p class="text-xs text-gray-500">Animated luxury typography, kinetic titles, intro & outro video templates.</p>
            </div>

            <div class="luxury-card p-6 rounded-3xl space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-1">Title Text</label>
                        <input id="hfTitleInput" type="text" value="SHIN MOTION" class="w-full p-2.5 rounded-xl border border-shin-border text-xs">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-1">Subtitle / Tagline</label>
                        <input id="hfSubtitleInput" type="text" value="Luxury AI Creative Universe" class="w-full p-2.5 rounded-xl border border-shin-border text-xs">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Motion Template</label>
                    <select id="hfTemplateSelect" class="w-full p-2.5 rounded-xl border border-shin-border text-xs bg-white">
                        <option value="luxury-glow">Luxury Rose Glow & Scale</option>
                        <option value="cinematic-fade">Cinematic 4K Slow Drift</option>
                        <option value="kinetic-pop">Kinetic Pop Typography</option>
                    </select>
                </div>

                <button id="renderHyperFrameBtn" class="luxury-btn w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2">
                    <i class="fa-solid fa-bolt"></i> Render Motion Graphics Clip
                </button>

                <div id="hfVideoContainer" class="hidden">
                    <video id="hfVideoPlayer" controls class="w-full rounded-2xl mt-4 border border-shin-border"></video>
                </div>
            </div>
        </div>
    `;

    document.getElementById("renderHyperFrameBtn").onclick = async () => {
        const title = document.getElementById("hfTitleInput").value;
        const subtitle = document.getElementById("hfSubtitleInput").value;
        const template = document.getElementById("hfTemplateSelect").value;

        try {
            const res = await fetch("/api/hyper-frames/render", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, subtitle, template })
            });
            const data = await res.json();
            if (data.success) {
                const cont = document.getElementById("hfVideoContainer");
                cont.classList.remove("hidden");
                const player = document.getElementById("hfVideoPlayer");
                player.src = data.frame.videoUrl;
                player.play();
            }
        } catch (e) {
            alert(e.message);
        }
    };
}

// -------------------------------------------------------------------------
// 7. FFMPEG VIDEO EDITOR
// -------------------------------------------------------------------------
function renderEditorStudio(container) {
    container.innerHTML = `
        <div class="max-w-4xl mx-auto space-y-6">
            <div>
                <h2 class="font-serif text-2xl font-bold text-shin-charcoal">FFmpeg Video Editor</h2>
                <p class="text-xs text-gray-500">Fast cloud-processed video trimming, speed scaling, resizing, and audio muxing.</p>
            </div>

            <div class="luxury-card p-6 rounded-3xl space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-1">Editor Action</label>
                        <select id="editorActionSelect" class="w-full p-2.5 rounded-xl border border-shin-border text-xs bg-white">
                            <option value="trim">Trim Video (Start & Duration)</option>
                            <option value="speed">Adjust Speed (Fast/Slow-mo)</option>
                            <option value="resize">Resize / Reformat (1280x720)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-1">Speed Multiplier (if Speed)</label>
                        <input id="editorSpeedInput" type="number" step="0.25" value="1.5" class="w-full p-2.5 rounded-xl border border-shin-border text-xs">
                    </div>
                </div>

                <button id="runEditorBtn" class="luxury-btn w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2">
                    <i class="fa-solid fa-scissors"></i> Process Video with FFmpeg
                </button>

                <div id="editorOutputContainer" class="hidden">
                    <span class="text-xs font-bold text-shin-darkRose">Processed Output:</span>
                    <video id="editorOutputVideo" controls class="w-full rounded-2xl mt-2 border border-shin-border"></video>
                </div>
            </div>
        </div>
    `;

    document.getElementById("runEditorBtn").onclick = async () => {
        const action = document.getElementById("editorActionSelect").value;
        const speed = document.getElementById("editorSpeedInput").value;

        try {
            const res = await fetch("/api/editor/process", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, speed })
            });
            const data = await res.json();
            if (data.success) {
                const cont = document.getElementById("editorOutputContainer");
                cont.classList.remove("hidden");
                const v = document.getElementById("editorOutputVideo");
                v.src = data.result.videoUrl;
                v.play();
            }
        } catch (e) {
            alert(e.message);
        }
    };
}

// -------------------------------------------------------------------------
// 8. WHISPER CAPTION STUDIO
// -------------------------------------------------------------------------
function renderWhisperStudio(container) {
    container.innerHTML = `
        <div class="max-w-4xl mx-auto space-y-6">
            <div>
                <h2 class="font-serif text-2xl font-bold text-shin-charcoal">Whisper Caption Studio</h2>
                <p class="text-xs text-gray-500">Automatic speech-to-text, word-by-word karaoke timestamps, and exportable SRT subtitles.</p>
            </div>

            <div class="luxury-card p-6 rounded-3xl space-y-4">
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Audio Narration / Sample Transcript</label>
                    <textarea id="whisperSampleTextInput" rows="3" placeholder="Welcome to SHIN MOTION AI. Where cinematic storytelling meets luxury pink elegance." class="w-full p-3 rounded-xl border border-shin-border text-xs resize-none">Welcome to SHIN MOTION AI. Where cinematic storytelling meets luxury pink elegance.</textarea>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-1">Caption Animation Style</label>
                        <select id="captionStyleSelect" class="w-full p-2.5 rounded-xl border border-shin-border text-xs bg-white">
                            <option value="karaoke-pink">Karaoke Rose Highlight</option>
                            <option value="minimal-luxury">Minimal White Clean</option>
                            <option value="bold-movie">Cinematic Bold Yellow</option>
                        </select>
                    </div>
                </div>

                <button id="runWhisperBtn" class="luxury-btn w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2">
                    <i class="fa-solid fa-closed-captioning"></i> Generate Word-Aligned Captions & SRT
                </button>

                <div id="whisperResultContainer" class="hidden space-y-3">
                    <h5 class="text-xs font-bold text-shin-darkRose uppercase">Aligned Words (Karaoke Timeline)</h5>
                    <div id="whisperWordsList" class="flex flex-wrap gap-2 p-3 bg-shin-blush rounded-2xl border border-shin-rose/20"></div>

                    <h5 class="text-xs font-bold text-shin-charcoal uppercase">SRT Subtitle Export</h5>
                    <pre id="srtContentBox" class="p-3 bg-shin-black text-shin-pink text-xs rounded-2xl font-mono overflow-x-auto max-h-40"></pre>
                </div>
            </div>
        </div>
    `;

    document.getElementById("runWhisperBtn").onclick = async () => {
        const demoText = document.getElementById("whisperSampleTextInput").value;
        const captionStyle = document.getElementById("captionStyleSelect").value;

        try {
            const res = await fetch("/api/whisper/transcribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ demoText, captionStyle })
            });
            const data = await res.json();
            if (data.success) {
                const cont = document.getElementById("whisperResultContainer");
                cont.classList.remove("hidden");
                const wordsList = document.getElementById("whisperWordsList");
                wordsList.innerHTML = (data.transcription.words || []).map(w => `
                    <span class="px-2.5 py-1 rounded-lg bg-white border border-shin-rose/30 text-xs font-semibold text-shin-charcoal">
                        ${w.word} <span class="text-[10px] text-shin-darkRose font-normal">${w.start}s</span>
                    </span>
                `).join("");
                document.getElementById("srtContentBox").innerText = data.transcription.srtContent;
            }
        } catch (e) {
            alert(e.message);
        }
    };
}

// -------------------------------------------------------------------------
// 9. VIDEO RESEARCH STUDIO (yt-dlp)
// -------------------------------------------------------------------------
function renderResearchStudio(container) {
    container.innerHTML = `
        <div class="max-w-4xl mx-auto space-y-6">
            <div>
                <h2 class="font-serif text-2xl font-bold text-shin-charcoal">Video Research Studio</h2>
                <p class="text-xs text-gray-500">Authorised media inspection, metadata extraction, structural breakdown and creative inspiration.</p>
            </div>

            <div class="luxury-card p-6 rounded-3xl space-y-4">
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Authorised Video URL</label>
                    <input id="researchUrlInput" type="url" placeholder="https://www.youtube.com/watch?v=..." class="w-full p-3 rounded-xl border border-shin-border text-xs">
                </div>

                <button id="inspectVideoBtn" class="luxury-btn w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2">
                    <i class="fa-solid fa-magnifying-glass-chart"></i> Inspect Video Structure with yt-dlp
                </button>

                <div id="researchResultContainer" class="hidden p-4 rounded-2xl bg-shin-blush/60 border border-shin-rose/20 space-y-3">
                    <div class="flex items-center justify-between">
                        <h4 id="researchTitle" class="font-bold text-sm text-shin-charcoal"></h4>
                        <span id="researchDuration" class="text-xs text-shin-darkRose font-semibold"></span>
                    </div>
                    <p id="researchChannel" class="text-xs text-gray-500"></p>
                    <p id="researchDesc" class="text-xs text-gray-600 line-clamp-3"></p>
                </div>
            </div>
        </div>
    `;

    document.getElementById("inspectVideoBtn").onclick = async () => {
        const url = document.getElementById("researchUrlInput").value;
        if (!url.trim()) return alert("Please enter a video URL.");

        try {
            const res = await fetch("/api/research/inspect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url })
            });
            const data = await res.json();
            if (data.success) {
                const cont = document.getElementById("researchResultContainer");
                cont.classList.remove("hidden");
                document.getElementById("researchTitle").innerText = data.data.title;
                document.getElementById("researchDuration").innerText = `Duration: ${data.data.durationFormatted}`;
                document.getElementById("researchChannel").innerText = `Uploader: ${data.data.uploader}`;
                document.getElementById("researchDesc").innerText = data.data.description;
            } else {
                alert(data.message || "Inspection failed.");
            }
        } catch (e) {
            alert(e.message);
        }
    };
}

// -------------------------------------------------------------------------
// 10. PROJECT MANAGEMENT & HISTORY
// -------------------------------------------------------------------------
function renderProjectsStudio(container) {
    container.innerHTML = `
        <div class="max-w-4xl mx-auto space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="font-serif text-2xl font-bold text-shin-charcoal">My Creative Projects</h2>
                    <p class="text-xs text-gray-500">Persistent storage, storyboards, and project asset collections.</p>
                </div>
            </div>

            <div class="luxury-card p-6 rounded-3xl space-y-4">
                <div class="flex gap-3">
                    <input id="newProjectNameInput" type="text" placeholder="Enter new project title..." class="flex-1 p-2.5 rounded-xl border border-shin-border text-xs">
                    <button id="createProjectBtn" class="luxury-btn px-6 py-2.5 rounded-xl text-xs font-semibold">
                        Add Project
                    </button>
                </div>

                <div class="space-y-3 pt-3" id="projectsListContainer">
                    <div class="p-4 rounded-2xl bg-shin-blush border border-shin-rose/20 flex items-center justify-between">
                        <div>
                            <h4 class="font-bold text-sm text-shin-charcoal">Sakura Blossom Story</h4>
                            <p class="text-xs text-gray-500">Active Cinema Production • Neo Tokyo</p>
                        </div>
                        <span class="text-xs font-bold text-shin-darkRose">Active Workspace</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById("createProjectBtn").onclick = async () => {
        const name = document.getElementById("newProjectNameInput").value;
        if (!name.trim()) return alert("Project title is required.");
        try {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Project '${data.project.name}' created!`);
                document.getElementById("newProjectNameInput").value = "";
            }
        } catch (e) {
            alert(e.message);
        }
    };
}

function renderHistoryStudio(container) {
    container.innerHTML = `
        <div class="max-w-5xl mx-auto space-y-6">
            <div>
                <h2 class="font-serif text-2xl font-bold text-shin-charcoal">Downloads & Asset History</h2>
                <p class="text-xs text-gray-500">All previously generated images, videos, audio tracks and exports.</p>
            </div>

            <div class="luxury-card p-6 rounded-3xl" id="historyDisplayArea">
                <p class="text-xs text-gray-400">Loading export archives...</p>
            </div>
        </div>
    `;

    fetch("/api/history")
        .then(r => r.json())
        .then(d => {
            if (d.success) {
                const area = document.getElementById("historyDisplayArea");
                const images = d.history.images || [];
                const videos = d.history.videos || [];
                area.innerHTML = `
                    <div class="space-y-6">
                        <div>
                            <h4 class="font-bold text-xs uppercase tracking-wider text-shin-darkRose mb-2">Video Archives (${videos.length})</h4>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                ${videos.map(v => `
                                    <div class="p-2 rounded-xl bg-shin-blush text-xs border border-shin-rose/20">
                                        <p class="font-bold truncate text-shin-charcoal">${v.title || v.prompt || "Video Clip"}</p>
                                        <a href="${v.videoUrl}" download class="text-[11px] text-shin-darkRose font-semibold hover:underline mt-1 block">Download MP4</a>
                                    </div>
                                `).join("")}
                            </div>
                        </div>

                        <div>
                            <h4 class="font-bold text-xs uppercase tracking-wider text-shin-darkRose mb-2">Image Archives (${images.length})</h4>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                ${images.map(img => `
                                    <div class="p-2 rounded-xl bg-shin-blush text-xs border border-shin-rose/20">
                                        <img src="${img.imageUrl || img.resultUrl}" class="w-full h-24 object-cover rounded-lg mb-1">
                                        <p class="truncate text-gray-600">${img.prompt || "Image"}</p>
                                    </div>
                                `).join("")}
                            </div>
                        </div>
                    </div>
                `;
            }
        });
}
