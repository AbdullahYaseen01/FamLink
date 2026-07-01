# FamLink — SaaS Explainer (Motion Design)

A 75‑second, on‑brand motion‑design explainer for **FamLink**, built straight from the
website's real assets (Livvic typeface, the chain‑link logo, and the brand palette).

It runs as a single self‑contained HTML "video" you can play fullscreen and **screen‑record to MP4**,
and it doubles as a **frame‑accurate animatic / styleframe reference for After Effects**.

```
explainer/
├─ famlink-explainer.html   ← the video (open / record this)
├─ logo.png                 ← FamLink chain-link mark (from src/assets/images/logo3.png)
├─ Livvic-*.ttf             ← brand font (Regular / Medium / SemiBold / Bold / Black)
└─ README.md
```

---

## ▶ How to play it

1. Open `famlink-explainer.html` in Chrome (double‑click, or serve the folder).
2. Press **F11** for fullscreen.
3. Click the **play** button (or press **Space**). It runs once, ~75 s, then shows **↻ Replay**.

> The stage is locked to **1920×1080 (16:9)** and auto‑scales to fill any screen, so the
> framing stays clean for recording at any monitor size.

## ⏺ How to record the MP4

**Windows (built‑in):** `Win + Alt + R` (Xbox Game Bar) records the active window.
Or use **OBS Studio** (free) → *Window Capture* on the browser → 1920×1080, 60 fps → click play → stop after the CTA.

**Tip:** start the recording, *then* click play, so you capture from the first frame.
For the cleanest export: OBS at 1080p60, MP4/H.264, ~12–16 Mbps.

**Capture the audio:** the video now plays a **female voiceover + soft background music** (see below).
In your recorder, make sure **desktop / system audio** is enabled (OBS: add an *Audio Output Capture*
source; Game Bar captures system audio by default). Keep the browser tab focused while recording.

---

## 🔊 Audio (voiceover + music)

Both are **generated live in the browser** — no audio files, no internet, no copyright issues, and
they record perfectly via desktop audio.

- **Female voiceover** — uses the browser's built‑in speech synthesis, auto‑selecting a female
  English voice (on Windows this is typically *Microsoft Zira*). Each line is spoken in sync with the
  on‑screen caption. The full script text lives in the `cues` array — edit there to reword.
- **Background music** — a soft, royalty‑free ambient bed (Web Audio API): a warm chord progression
  that shifts once per scene, with a gentle arpeggio. It **fades in** at the start, **ducks to ~40%**
  whenever the voiceover speaks, and **fades out** over the final 3 seconds.
- **Controls** — the bottom bar has **🔊 Voice** and **♪ Music** toggles. Mute either to record a
  clean variant (e.g. music‑only, so you can drop in a professionally‑recorded VO later).

> Voice quality depends on the OS voices installed. For a polished final cut, mute 🔊 Voice and lay a
> studio voiceover over the music‑only recording — the captions are already timed to the script.

## 🎬 Scene & timing breakdown (matches the script)

| # | Scene | In → Out | What animates |
|---|-------|----------|---------------|
| 1 | **The Problem** | 0:00–0:10 | Shocked parent; childcare bills stack & count up **$2,000 → $2,500 → $3,000/mo**; frustrated caregiver at **$14/hr ▼** |
| 2 | **The Old Way** | 0:10–0:18 | 3 families ↔ 3 separate caregivers, tangled dashed links, coins leaking ("Everyone hires separately") |
| 3 | **Introducing FamLink** | 0:18–0:28 | Logo + wordmark reveal, tagline, families/caregivers connect into a central FamLink hub |
| 4 | **How It Works** | 0:28–0:42 | Map view; family pins drop with ✓; qualified caregiver pin; match lines draw; **"✓ Match found"** stamp |
| 5 | **Families Save** | 0:42–0:52 | Two family cards count **$20 → $12/hr**, "Save 40%", **≈ $1,280/mo saved per family** |
| 6 | **Caregivers Earn More** | 0:52–0:62 | Caregiver dashboard; income line + bars rise; earnings **$3,200 → $4,800**, 3 families, 0 extra miles |
| 7 | **Win · Win · Win** | 0:62–0:70 | Three hearts (Families / Caregivers / FamLink) slide into a Venn overlap |
| 8 | **Call To Action** | 0:70–0:75 | Logo, **Join FamLink Today →**, pills (Shared Care · Lower Costs · Higher Earnings), confetti |

Captions are baked into `cues` in the script block, each `[seconds, text]`. Edit there to retime/reword.

---

## 🎨 Brand system used (pulled from the site)

| Token | Value | Use |
|-------|-------|-----|
| Navy | `#001243` | headlines / primary text |
| Sky (logo) | `#38BDF8` | brand accent, links, highlights |
| Sky 2 | `#85D1F1` | gradients |
| Periwinkle | `#AEC4FF` | buttons / soft fills |
| Green | `#16A86F` / `#025747` | savings & earnings (positive) |
| Pink | `#FFADE1` | secondary accent |
| Yellow | `#FACC15` | stars / coins |
| Type | **Livvic** (400/500/600/700/900) | all text |

Real numbers come from the live site (NannyShare "two families share one nanny", the
$20→$12 shared‑rate example, caregiver "earn more / no extra travel" framing).

---

## 🧩 Rebuilding it in After Effects

This HTML is designed to be a **director's animatic** — every scene, layout, color, font, and
timing is production‑final, so an animator can match it 1:1:

- **Comp:** 1920×1080, 30 fps, 75 s (or 8 sub‑comps using the In→Out times above).
- **Fonts/Logo:** the exact `Livvic-*.ttf` and `logo.png` are in this folder — drop them straight in.
- **Easing:** entrances use `cubic-bezier(.2,.9,.25,1)`‑style overshoot → AE "Easy Ease" + a small overshoot, or the *Animation Composer / Ease & Wizz* presets.
- **Motifs to recreate as shape layers:** stacking bills (Scene 1), tangled vs. clean links (2 vs 3/4), pin "drop‑in" with bounce (3/4), `stroke-dashoffset` line draws → AE **Trim Paths** (3/4/6), count‑up numbers → AE **Slider Control + expression** (1/5/6), Venn merge (7).
- Swap the emoji avatars for FamLink's illustrated characters if you have them; everything else is vector‑faithful.

---

*Shared Care. Lower Costs. Higher Earnings. — Powered by FamLink 🚀*
