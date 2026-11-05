# QA report — 4 Nov 2026

Tested in headless Chrome on six screen sizes: 1920×1080, 1366×768,
1024×768 (tablet landscape), 768×1024 (tablet portrait), 390×844 and 360×740 (phones).
Touch input was simulated on tablets and phones.

## Results after fixes

| Check | Result |
| --- | --- |
| Loading | Loader finishes in about 5.5–6 s on a software renderer (it waits for fonts and the first 3D frames; 7 s failsafe) |
| Container interaction | Tap or click opens it; the crane fetches it, the doors open and the content shows inside, on every size |
| Detail panel | Opens with "Explore project"; Esc steps back panel → container → pile |
| Video playback | MP4 plays (custom controls); YouTube / Vimeo load on click |
| Gallery | Lightbox opens, arrows / swipe / thumbnails work, Esc closes the lightbox only |
| Website iframes | Live preview where allowed; screenshot plus a message where blocked or after 10 s |
| Layout | No horizontal scrolling on any size; content stays inside the viewport |
| JavaScript errors | None |
| Tap targets | Buttons in the panel are 36–40 px tall |

## Bugs found and fixed

1. **Phones and tablets: weak hero composition.** The rail and crane sat mid-screen and the pile was small. Phones now use a narrower 2-2-2-1 stack that fills the screen.
2. **Phones: text inside the open container was too small to read** (about 7 px). Phones now get a compact version with a larger title and buttons.
3. **Phones and tablets: back-row containers poked through the lifted one.** On tall screens the container now lifts forward, and the gantry (rail, trolley and hook) moves with it so the cable stays vertical.
4. **Phones: the "Close container" button overlapped the caption, and the top of the screen got crowded while the panel was open.** The caption and tagline now fade out while a project is open, and the Close button hides while the panel is open.
5. **Laptops: the open container was cut off at the left when the panel opened.** The shift is now calculated from the panel's real width.
6. **Rail hanger rods crossed the header.** Removed (they aren't in the reference).
7. **Small tap targets** (27 px) in the panel. Raised to 36–40 px.
8. **Low contrast** for small labels on the blue background (below WCAG AA 4.5:1). Raised.
9. **No favicon (404), no share image, no sitemap.** Added (see SEO).
10. **Preview page only:** a leftover line of CSS broke the header layout. Fixed.

## Performance on mobile

- **Quality tier:** phones and tablets (touch screens, or narrower than 768 px) render at a pixel ratio of 1.25 with no antialiasing, 1024 px shadow maps and lighter reflections. Desktops use 1.75.
- **Adaptive resolution:** `PerformanceMonitor` lowers the pixel ratio if the frame rate drops, and raises it again if there's headroom.
- **Pausing off-screen:** 3D rendering stops while the hero is scrolled out of view, which saves battery on the project list and contact sections.
- **Rendering cost:** about 150 draw calls and 2,500 triangles per frame, which is light for any phone made in the last 5 years. Frame rate couldn't be measured meaningfully here, because the test machine draws 3D in software.

## Accessibility

- Skip link to the project list.
- Every container can also be opened from the keyboard through the Cargo manifest list.
- Focus outlines are visible.
- The panel and lightbox are labelled dialogs; focus moves into them and returns on close.
- Reduced motion: no intro dolly or drop animation, and crane moves play 1.8× faster.
- All images have alt text, and all buttons have accessible names.

## SEO

- Title, description, keywords, canonical URL.
- Open Graph and Twitter cards with a generated share image (`app/opengraph-image.tsx`).
- `sitemap.xml` and `robots.txt`.
- Person structured data (JSON-LD).
- `lang="en"`, with a hidden h1 that describes the page.
- Custom 404 page.

## Links

- All local media paths in `projects.ts` resolve: 63 files, all present.
- External links to check after deploy: LinkedIn, and the sample links in Project 01 (example.com, google.com, YouTube, Vimeo). Replace the samples with your real ones.

## Live-site test (after deploy)

Tested https://monalisa-portfolio-seven.vercel.app in a real Chromium browser at 1366×768 and 390×844.

- **Bug found and fixed: "Explore project" closed the container instead of opening the panel.** The text and buttons inside an open container are HTML placed inside the 3D canvas's event area. A click on them also reached the 3D scene as a click on empty background, which closes the container. Background clicks that start inside that HTML are now ignored.
- Header now shows the full name, "Monalisa Padhi" (slightly smaller on phones so it fits beside "Let's Talk").
- Loads in about 5 s with all three web fonts. No horizontal scrolling. No JavaScript errors.
- LinkedIn returns status 999 to automated checkers; that's LinkedIn blocking bots, and the link works in a normal browser.

## Still to verify on the live site

- Real-device frame rate on your own phone.
- The `/api/embed-check` route; it needs the Vercel server.
- Font rendering: web fonts were blocked in the test sandbox, so the screenshots use fallback fonts.
