# AQUA

## Direction and contract
An aquarium viewed in a quiet exhibition room: the living aquascape owns the screen, with a small instrument strip below it. Target: natural materials, detailed anatomy, unhurried motion. Avoid cartoon fish, neon HUDs, marketing sections.

The user's realistic 3D simulation brief defines the art direction. Considered: underwater first-person view; glass tank in an exhibition room; technical aquascaping editor. Chosen: glass tank because it exposes depth, reflections and the complete ecosystem together. References: [ADA Eternal and Life](https://www.adana.co.jp/en/aquajournal/nature-aquarium-gallery-05/) for branching wood and open swimming space; [Blue After the Rain](https://www.adana.co.jp/en/aquajournal/nature-in-the-glass-aj310/) for directional driftwood; [ADA Trend 2020](https://www.adana.co.jp/en/aquajournal/nature-in-the-glass-292/) for transparent glass and planted banks. No reference assets are copied.

The 3D model, actual reflected scene and moving caustics are the signature details. No decorative UI effects. Typography candidates: Geologica (clear Cyrillic, rounded aquatic rhythm), Manrope (precise but more mechanical), system sans (inconsistent cross-platform). Choose locally hosted Geologica, weights 340 and 500.

## Interface tokens
- Canvas #0a1412; surface #14221e; raised #20352c; line #344b41; primary text #f2f5ed; secondary #abbab0; accent #c9e6ac; focus #b4dbff.
- Font Geologica, sans-serif. Small 11px, caption 12px, body 14px, title 24px; brand 20px. Line heights 1.5 body, 1.2 title. Weights 340, 500. Tracking brand .2em; small .08em.
- Spacing 4, 8, 12, 16, 24, 32, 48px. Desktop edge 32, mobile 16. Controls height 44px, icon 20px. Panel radius 16px, control pill 999px.
- Motion: real fish propulsion, plant current and settling food. UI press 80ms, micro 160ms, small 220ms, medium 320ms, spring 450ms. Adopt BetterUI interaction kit. Reduced motion starts simulation paused; manual resume available. Rendering stops when hidden. All scene animation shares a pauseable simulation clock.

## Behavior
Orbit with drag, zoom with wheel/pinch; named preset buttons provide single-pointer alternatives, arrows and +/- provide keyboard camera control. Feed releases particles and attracts fish. Pause freezes water/plants/fish. Day/sunset/night changes real light. Quality changes pixel ratio, and shadows. Fullscreen uses the browser API with failure feedback. Native details/settings dialog with Escape and focus restoration. WebGL failure exposes retry.

## Responsive and verification
Desktop 1440×900, Deck 1280×800, tablet 768×1024, mobile 375×812 and 320×800, ultrawide 2560×1080; zoom 75/100/150%. Canvas grows with viewport; toolbar wraps on mobile and camera fits the tank. No fake live telemetry. Fish count comes from the scene. A loading splash only covers actual WebGL bootstrap.
Acceptance: rendered scene with no console/shader errors, visible detailed fish, functional feed/pause/light/camera/quality controls, no overflowing interface, keyboard and reduced-motion behavior. Actual results recorded in QA.md.
