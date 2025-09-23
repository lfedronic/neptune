# Neptune Copilot UX Prototype

Minimal Electron proof-of-concept that provides a floating copilot entry point, centered chat prompt, screen capture, and animated cursor guidance.

## Scripts

- `npm run dev` – start Electron in development mode.
- `npm run build` – placeholder command (not required for this MVP).

## Features

- Always-on-top floating overlay button to open the copilot prompt.
- Translucent, auto-resizing chat input centered on the primary display.
- macOS desktop capture with local downscaled PNG storage under `~/Library/Application Support/neptune/captures/`.
- Permission helper dialog for macOS screen recording access.
- Cursor glide animation overlay with placeholder instructional tooltips.

## Development

Install dependencies with `npm install`, then run `npm run dev` to launch the prototype.
