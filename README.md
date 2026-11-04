# Monalisa Padhi — Portfolio Depot

A 3D shipping-container portfolio.

An immersive personal portfolio: a pile of shipping containers sits in front of a
giant **PORTFOLIO** word. Click one (or a menu link) and an overhead crane rolls
over, grabs it, lifts it into view and swings the doors open to reveal what's inside.

Built with **Next.js (App Router) · TypeScript · Tailwind CSS · React Three Fiber ·
Three.js · GSAP**.

---

## 1. Getting started

You need [Node.js](https://nodejs.org) **20 or newer** (check with `node -v`).

```bash
cd container-portfolio
npm install        # downloads all libraries (one time, ~1–2 min)
npm run dev        # starts the dev server
```

Open **http://localhost:3000**. Edit any file and the page updates instantly.

| Command             | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Local development server with hot reload      |
| `npm run build`     | Production build (run this before deploying)  |
| `npm start`         | Serve the production build                    |
| `npm run typecheck` | Check TypeScript types without building       |

**Make it yours first:** edit your projects in `src/data/projects.ts` and your
name, about text and email in `src/data/site.ts`.

Recommended VS Code extensions: *Tailwind CSS IntelliSense*, *ESLint*, *Prettier*.

---

## 2. What the reference does (visual analysis)

From the reference video:

| Element | Detail | Where it lives |
| --- | --- | --- |
| Background | Flat, saturated cobalt blue | `--harbor` in `globals.css` |
| Hero word | Huge cream **PORTFOLIO**, ultra-bold, bleeding off both edges, sitting *behind* the 3D | `ui/Backdrop.tsx` |
| Pile | 7 tumbled containers in red, blue, orange, yellow, grey; each door has a big white stencil label (THE WORK, WHAT I DO, PORTFOLIO, ABOUT ME, PROCESS, SAY HELLO, TOOL KIT) and a small code | `data/projects.ts`, `scene/ProjectContainer.tsx` |
| Crane | Light-grey rail across the top, a trolley, a cable and an H-shaped spreader | `scene/Crane.tsx` |
| Interaction | Click → trolley slides over → cable lowers → grabs → lifts to top centre, straightens, gets bigger → doors swing open → dark interior shows the section content | `scene/Depot.tsx` |
| UI | Small wordmark left, 4 links centre, "Let's Talk ↗" right, tiny mono caption under the nav | `ui/Navbar.tsx`, `ui/Hud.tsx` |

---

## 3. Project architecture

```
src/
├─ app/                      Next.js App Router
│  ├─ api/embed-check/route.ts  Checks whether a site allows iframes
│  ├─ layout.tsx             <html>, fonts (Archivo Black, Inter, JetBrains Mono), metadata
│  ├─ page.tsx               The home route — just renders <PortfolioApp />
│  └─ globals.css            Tailwind import + design tokens (colours, fonts)
│
├─ components/
│  ├─ PortfolioApp.tsx       Page "brain": shared state + intro animation
│  ├─ ui/                    Plain HTML/Tailwind layers on top of / behind the 3D
│  │  ├─ Loader.tsx          Loading screen (counter + container on a rail)
│  │  ├─ Navbar.tsx
│  │  ├─ Backdrop.tsx        The giant PORTFOLIO word (behind the canvas)
│  │  ├─ Hud.tsx             Caption, status line, tagline, scroll cue, Close
│  │  ├─ CinemaOverlay.tsx   Soft top light + faint corner shading
│  │  ├─ Manifest.tsx        "Cargo manifest": list of all projects
│  │  └─ AboutContact.tsx    About + contact footer
│  └─ scene/                 Everything inside the WebGL <Canvas>
│     ├─ Experience.tsx      Canvas, lights, reflections, shadows, camera
│     ├─ Depot.tsx           Pile + crane + the GSAP fetch/return choreography
│     ├─ ProjectContainer.tsx   One procedural container (walls, frame, doors)
│     ├─ Crane.tsx           Rail, trolley, cable, spreader
│     └─ ContainerContent.tsx   Title card shown inside an open container
│  ├─ project/               The detail view
│  │  ├─ ProjectPanel.tsx    Slide-in panel (bottom sheet on phones)
│  │  ├─ ProjectGallery.tsx  Photo grid / screenshot strip → Lightbox
│  │  ├─ Lightbox.tsx        Full-screen image viewer (zoom, swipe, keys)
│  │  ├─ VideoGallery.tsx    Player + playlist
│  │  ├─ MediaPlayer.tsx     Custom MP4 player
│  │  ├─ EmbedPlayer.tsx     YouTube / Vimeo (loads on click)
│  │  ├─ WebsitePreview.tsx  Live iframe or screenshot fallback + "Open site"
│  │  └─ PdfViewer.tsx       PDF case studies
│
├─ data/
│  ├─ projects.ts            ✏️  YOUR PROJECTS — text, media, previews, links, pile slots
│  └─ site.ts                ✏️  Name, tagline, about, email, nav links
└─ lib/
   ├─ constants.ts           Sizes, crane heights, colours for the 3D scene
   ├─ media.ts               YouTube/Vimeo link parsing, time formatting
   ├─ heroState.ts           Scroll + intro progress shared with the 3D scene
   └─ textures.ts            Canvas-generated corrugated steel + stencil lettering
```

**Layering (back to front):** cobalt `<main>` → `Backdrop` (PORTFOLIO) → transparent
3D canvas → `Navbar` + `Hud`. Because the canvas is transparent, the containers
appear in front of the word, just like the reference.

### How data flows

```
 Navbar / Hud / click on a container
              │  setRequestedId("what-i-do")
              ▼
        PortfolioApp  (requestedId, phase, openId, hoveredId)
              │ props
              ▼
   Experience → Depot ──► GSAP timeline animates a plain `crane` object
                  │       { x, z, cable, scale } + door rotations
                  ▼
         Crane & carried container read it every frame (useFrame)
                  │
                  └─► onPhaseChange("open", id) → UI updates (status, Close button)
```

Two rules keep this simple and fast:

1. **React state is only for "what" changes** (which container, which phase).
2. **Animation values live in refs / plain objects** that GSAP tweens and
   `useFrame` reads — so nothing re-renders 60 times a second.

---

## 4. The components explained

- **`PortfolioApp`** — Holds four pieces of state. `requestedId` is what the
  visitor *asked* for; `phase` (`idle → fetching → open → closing`) and `openId`
  are what the crane is *actually* doing. It also plays the intro (letters rise,
  UI fades in) and listens for **Esc**. The 3D scene is loaded with
  `dynamic(..., { ssr: false })` because WebGL only exists in the browser.

- **`Experience`** — Creates the R3F `<Canvas>` (transparent, `flat` so colours
  stay punchy), a hemisphere + directional light, an `<Environment>` made of
  `Lightformer` panels for soft metal reflections (no HDR download), and
  `ContactShadows` under the pile. `CameraRig` backs the camera off on narrow
  screens and adds subtle mouse parallax. Clicking empty space closes.

- **`Depot`** — The choreographer. It keeps a `Map` of every container's
  `group` and door pivots (registered by each container), and builds GSAP
  timelines:
  - *fetch*: trolley → over the slot, lower cable, grab, straighten, lift to the
    top centre while scaling up, doors open with a little `back.out` overshoot.
  - *return*: doors close, carry back, lower, restore the tilt, release.

  A tiny queue makes sure only one journey runs at a time; if you click another
  container while one is open, it returns the first, then fetches the next.

- **`ProjectContainer`** — Pure geometry, no 3D model files: corrugated walls
  (a canvas-generated colour + normal map repeated across each face), a darker
  steel frame, two doors on hinge pivots with locking bars, the stencil label
  and code, and a dark interior box rendered from the inside (`BackSide`).
  Hover lifts it slightly and adds a glow.

- **`Crane`** — A rail, a trolley with wheels, a cable (a unit cylinder
  stretched and rotated between trolley and hook every frame) and an H-shaped
  spreader whose legs grip the container ends.

- **`ContainerContent`** — Uses drei's `<Html transform>` to place real HTML
  inside the container. It moves with the 3D object but stays crisp and
  clickable (e.g. the email button). This is where video and images will go.

- **`Navbar` / `Backdrop` / `Hud`** — Ordinary Tailwind components. Nav links
  map to container ids in `NAV_LINKS`.

---

## 5. The hero, feature by feature

| Feature | How it works | File |
| --- | --- | --- |
| Loading screen | Counts to 88%, waits until fonts are loaded and the 3D scene has drawn its first frames, finishes to 100%, then slides up like a roller door. A 7-second failsafe means it can never hang. | `ui/Loader.tsx` |
| Intro | Camera dollies in from far away, containers drop into the pile with a small thud, the trolley rolls in, PORTFOLIO letters rise | `PortfolioApp.tsx`, `Depot.tsx`, `Experience.tsx` |
| Cinematic light | Warm key light with soft shadows, cool rim light from behind, sky fill, light-panel reflections and contact shadows. The overall look stays flat and clean like the reference | `Experience.tsx`, `ui/CinemaOverlay.tsx` |
| Mouse | Camera gently follows the pointer; hovered containers lift and glow | `Experience.tsx` → `CameraRig` |
| Scroll | The hero sticks for ~1.6 screens. Scrolling raises the camera to look down into the pile, turns the depot, lifts the PORTFOLIO word away and fades the small text, then the Cargo manifest scrolls in | `PortfolioApp.tsx` (GSAP ScrollTrigger) |
| Responsive | Screens taller than wide (phones) get a narrower 3-3-1 pile (`slotTall` in the data). The camera always backs off just enough to fit the pile. Lighter shadows and fewer particles on small screens. | `data/projects.ts`, `Experience.tsx` |

## 6. The project containers and their media

There are 7 containers (Project 01–07) with placeholder content. Everything a
container shows comes from **`src/data/projects.ts`**, so you add or change
projects there and never touch a component. Any media list can be left out;
its section then simply doesn't appear.

```ts
{
  id: "project-02",                 // also the media folder: public/projects/project-02/
  code: "PD-02", label: "PROJECT\n02", // paint on the doors ("\n" = new line)
  title, category, year, role, summary,
  description: ["paragraph", "paragraph"],
  tags: ["…"],
  color: "#2342c4",

  photos: [{ src: "/projects/project-02/photo-1.jpg", alt: "…", caption: "…" }],
  videos: [
    { type: "file",    src: "/projects/project-02/demo.mp4", poster: "/projects/project-02/poster.jpg", title: "…" },
    { type: "youtube", url: "https://www.youtube.com/watch?v=…", title: "…" },
    { type: "vimeo",   url: "https://vimeo.com/123456789", title: "…" },
  ],
  websites: [{ title: "…", url: "https://…", screenshot: "/projects/project-02/site.jpg" }],
  screenshots: [{ src: "/projects/project-02/site-2.jpg", alt: "…" }],
  caseStudies: [{ title: "…", src: "/projects/project-02/case-study.pdf", pages: 12, cover: "/projects/project-02/cover.jpg" }],
  links: [{ label: "…", url: "https://…" }],
  slot, slotTall,                   // where it sits in the pile
}
```

To add an 8th project, copy one object, give it a new `id`, `code` and a free
`slot`, and add its folder under `public/projects/`.

**Project 01 demonstrates everything**: two MP4s, a YouTube and a Vimeo embed
(sample videos, replace them), an embeddable site (example.com) and a site
that refuses embedding (google.com) so you can see the fallback.

### How each media type behaves

| Media | What the visitor gets | Component |
| --- | --- | --- |
| Photos | Grid; click opens a full-screen **lightbox** with arrows, swipe, thumbnails, captions, 2× zoom with drag, Esc to close | `ProjectGallery`, `Lightbox` |
| MP4 / WebM | **Custom player**: play/pause, seek bar with buffering, time, mute + volume, speed (0.5×–2×), picture-in-picture, fullscreen; keys Space/K, ←/→, M, F | `MediaPlayer` |
| YouTube / Vimeo | A light cover with a play button; the real player (with its own controls) loads only on click. Any link format works: watch?v=, youtu.be, shorts, vimeo.com/… | `EmbedPlayer` |
| Several videos | One player + a playlist; switching stops the previous video | `VideoGallery` |
| Websites | Browser-style frame. The server checks the site's `X-Frame-Options` / `frame-ancestors` headers (`/api/embed-check`). If embedding is allowed, the live page loads (scaled from desktop width) with a Live / Screenshot toggle; if not, or if it doesn't load within 10 s, the screenshot is shown with a short message. "Open site ↗" always opens a new tab. Set `embed: false` to always use the screenshot. | `WebsitePreview` |
| Screenshots | Horizontal strip that opens in the lightbox | `ProjectGallery variant="strip"` |
| PDF case studies | Desktop: read inside the panel with the browser's PDF viewer. Phones: cover image + Open. Open ↗ and Download buttons on both. | `PdfViewer` |

The embed check only runs for URLs that are listed in `projects.ts`, so the
server can't be used to fetch other addresses. It needs a Node server (Vercel
or `npm start`); on purely static hosting the 10-second timeout handles the
fallback instead.

**Files:** keep photos around 1600–2400 px wide as JPG/WebP, videos as H.264
MP4 under ~10 MB (longer ones belong on YouTube/Vimeo), PDFs under ~15 MB.

### The click-to-open flow

1. The crane fetches the container and lifts it **to the centre**, under the rail, at
   about half the screen width (as in the reference).
2. The camera settles in front of it and the doors swing open; a warm light comes on.
3. On the dark back wall: index line, title with a highlighted word, tags, and
   **Explore project →** / **Close** buttons.
4. **Explore project** slides the container to the left half and opens the
   **ProjectPanel** with all the media sections (bottom sheet on phones).
5. Esc steps back one level (panel → container → pile). "Close container ✕",
   or a click on empty space, puts the container back. "Next container" swaps projects.

## 7. Customising

| I want to… | Edit |
| --- | --- |
| Rename containers, change text, colours, media | `src/data/projects.ts` |
| Name, tagline, about text, email | `src/data/site.ts` |
| Rearrange the pile | `slot` / `slotTall` in `projects.ts` |
| Bigger/smaller lifted container | `LIFT.scale` in `src/lib/constants.ts` |
| Background / accent colours | `:root` block in `src/app/globals.css` |
| Speed of the crane | durations in `fetchContainer` / `returnContainer` (`Depot.tsx`) |
| Door opening angle | `CONTAINER.doorOpenAngle` |

---

## 8. Roadmap (next steps, one at a time)

- [x] Project setup, first screen, crane fetch & door reveal
- [x] Hero: loading screen, cinematic lighting, camera intro, scroll animation, mouse parallax, phone layout
- [x] Project containers: crane fetch, door reveal, detail panel, gallery, video, website previews, links
- [ ] Replace placeholder media with real screenshots and recordings
- [ ] "The Work" container opens into a row of project mini-containers
- [ ] Loading screen + performance pass (instancing, lower-poly on mobile)
- [ ] Mobile layout (portrait camera, swipe between containers)
- [ ] Sound design (crane whirr, door clank) with a mute toggle
- [ ] Deploy to Vercel

## Troubleshooting

- **Blank screen?** Open the browser console (F12). WebGL must be enabled.
- **`npm install` errors?** Make sure `node -v` shows 20+; delete `node_modules`
  and `package-lock.json` and try again.
- **Fonts look plain for a second?** Normal — the container lettering repaints
  once the web font has loaded.
