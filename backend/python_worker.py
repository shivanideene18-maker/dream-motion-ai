import sys
import json
import os
import asyncio
from PIL import Image, ImageEnhance, ImageFilter

os.environ["PATH"] = "/home/jules/bin:/app/backend/node_modules/@ffmpeg-installer/linux-x64:" + os.environ.get("PATH", "")

def run_tts(text, voice, out_path):
    import edge_tts
    async def _gen():
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(out_path)
    asyncio.run(_gen())
    print(json.dumps({"success": True, "output": out_path}))

def run_whisper(audio_path):
    import whisper
    model = whisper.load_model("tiny", device="cpu")
    result = model.transcribe(audio_path, word_timestamps=True)
    words = []
    for seg in result.get("segments", []):
        for w in seg.get("words", []):
            words.append({
                "word": w.get("word", "").strip(),
                "start": round(w.get("start", 0), 2),
                "end": round(w.get("end", 0), 2)
            })
    print(json.dumps({
        "success": True,
        "text": result.get("text", "").strip(),
        "words": words,
        "language": result.get("language", "en")
    }))

def run_image_edit(action, in_path, out_path, extra_arg=None):
    img = Image.open(in_path)
    if action == "remove-bg":
        import rembg
        session = rembg.new_session("u2netp")
        res = rembg.remove(img, session=session)
        res.save(out_path, format="PNG")
    elif action == "replace-bg":
        import rembg
        session = rembg.new_session("u2netp")
        res = rembg.remove(img, session=session)
        bg_color = (255, 230, 240, 255) # default luxury baby pink
        if extra_arg and extra_arg.startswith("#") and len(extra_arg) == 7:
            h = extra_arg.lstrip("#")
            bg_color = tuple(int(h[i:i+2], 16) for i in (0, 2, 4)) + (255,)
        background = Image.new("RGBA", res.size, bg_color)
        background.paste(res, (0, 0), res)
        background.convert("RGB").save(out_path, format="JPEG", quality=95)
    elif action == "enhance":
        enh_color = ImageEnhance.Color(img).enhance(1.25)
        enh_contrast = ImageEnhance.Contrast(enh_color).enhance(1.2)
        enh_sharp = ImageEnhance.Sharpness(enh_contrast).enhance(1.3)
        enh_sharp.save(out_path, format="JPEG", quality=95)
    else:
        img.save(out_path)
    print(json.dumps({"success": True, "output": out_path}))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)
    mode = sys.argv[1]
    if mode == "tts":
        text = sys.argv[2]
        voice = sys.argv[3] if len(sys.argv) > 3 else "en-US-JennyNeural"
        out_path = sys.argv[4]
        run_tts(text, voice, out_path)
    elif mode == "whisper":
        audio_path = sys.argv[2]
        run_whisper(audio_path)
    elif mode == "image_edit":
        action = sys.argv[2]
        in_path = sys.argv[3]
        out_path = sys.argv[4]
        extra_arg = sys.argv[5] if len(sys.argv) > 5 else None
        run_image_edit(action, in_path, out_path, extra_arg)
