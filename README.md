# Voxen Studio

Lightweight, local-first GLSL shader playground for Voxen / Meta Quest 3 experimentation.

## MVP
- Live WebGL2 fragment preview (GLSL ES 3.0)
- Editable shader source and compiler diagnostics
- Built-in vortex and plasma presets
- Local browser persistence and JSON import/export
- No login, API server, database, cloud keys or dependencies

## Run

Open via a static HTTP server (ES modules require HTTP; opening file:// directly may fail):

```sh
python3 -m http.server 8080
# http://localhost:8080
```

Or run as a container:

```sh
docker build -t voxen-studio .
docker run --rm -p 8080:80 voxen-studio
```

## Planned

- AI agent/MCP bridge: shader generation, render capture, validation, feedback loop
- WebGPU and Vulkan/SPIR-V adaptation
- Uniform inspector, texture inputs and panorama preview
- Voxen-specific shader bundle export

MCP is **not connected yet**. Browser WebGL2 shader compilation does not ensure Vulkan compatibility.
