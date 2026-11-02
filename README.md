# CyberRun

CyberRun is a lightweight, browser-based 3D endless runner. Switch lanes, leap over neon barriers, slide beneath overhead beams, and collect energy while the city speeds up around you.

## Play

Open `index.html` with VS Code Live Server, then select **START RUN**. Three.js is loaded from jsDelivr, so an internet connection is required to load the 3D engine and display fonts.

### Controls

- **Move:** Left/Right arrows or **A / D**
- **Jump:** Up arrow, **W**, or **Space**
- **Slide:** Down arrow or **S**
- **Pause / resume:** **Esc** or the pause button
- **Mobile:** Swipe left/right to change lanes, swipe up to jump, swipe down to slide, or tap the play area to jump. The run opens in fullscreen when supported; tap **GAME INFO** for controls and project details. Opening the guide pauses the run.

Sound is generated with the Web Audio API and starts when you select **START RUN** (browser audio requires a user gesture). Sound is on by default; use the sound button to mute or unmute it. Brief alerts let you know when the run speeds up. Your best distance is saved in this browser.

## Project structure

```text
CyberRun/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   ├── game.js
│   ├── player.js
│   ├── obstacles.js
│   └── collectibles.js
└── README.md
```

The character, track, city, hazards, collectibles, and sound effects are generated procedurally; no model or audio downloads are needed.

## About

- Created by: Archimedes Cheruiyot
- Development: AI-assisted
- Project: CyberRun – 3D Endless Runner
