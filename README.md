# dotfiles

My Linux dotfiles: a Hyprland workstation setup with a fully local AI stack (llama-swap + a containerized pi agent harness) on an AMD GPU.

## Layout

```
config/
├── bash/        .bashrc (prompt, pi helper function)
├── dunst/       dunst notification config
├── fontconfig/  fonts.conf — Iosevka as default font system-wide
├── hyprland/    hyprland.lua (Lua config), hyprpaper.conf, BACKGROUND/ wallpaper
├── kitty/       blue/orange kitty theme
├── localAI/     llama-swap docker-compose + models config, pi container,
│                pi-home/ (agent models.json + extensions)
├── waybar/      waybar config, style, battery/temps scripts
├── wofi/        wofi app launcher config/style
├── yazi/        yazi.toml (nvim/code open menu) + theme.toml (blue/orange)
└── sddm/        SDDM blue/orange QML theme + drop-in sddm.conf
deps_install.sh  pacman deps + docker group
install.sh       symlinks everything into place
```

## Stack

- **WM**: Hyprland (dwindle, `SUPER` as mainMod), Waybar, Wofi, Dunst, Hyprpaper
- **Terminal**: kitty (IosevkaTerm Nerd Font); Iosevka is also the default font system-wide via fontconfig
- **File manager**: yazi (launched with `SUPER+E`)
- **Local AI** (all in docker, ROCm/Vulkan on AMD):
  - `llama-swap` (unified-vulkan image) serving local GGUF models on port 8081
  - `pi` — the [pi](https://github.com/earendil-works/pi) coding agent running in a sandbox container, pointed at llama-swap (behind the `tools` compose profile)
  - STT in pi — [pi-voice-stt](https://github.com/cgarrot/pi-voice-stt) (Ctrl+R dictation) talking to a whisper.cpp `whisper-server` (large-v3-turbo, CPU) in its own container from the official `ghcr.io/ggml-org/whisper.cpp` image; mic via the host's Pulse/PipeWire socket

## Install

```sh
git clone git@github.com:gps95/dotfiles ~/dotfiles
cd ~/dotfiles
./deps_install.sh   # optional: pacman packages (kitty, hyprland deps, yazi, docker, ...) + docker group
./install.sh
```

`install.sh` symlinks the configs into `~/.config` and `~`, copies the pi agent state (`config/localAI/pi-home/agent`) to `~/localAi/pi-home/`, creates `~/BACKGROUND` (drop wallpaper images there), then reloads Hyprland.
The `localAI/` stuff is symlinked to `~/localAi/` — you'll need docker and a local model folder (`~/localAi/aimodels`) before `docker compose up` will work.

## Notes / adapt to your machine

- `config/localAI/.env` — set `VIDEO_GID`/`RENDER_GID` to your host group IDs (`getent group video/render`) and `HSA_OVERRIDE_GFX_VERSION` to your GPU (`rocminfo | grep gfx`).
- `config/localAI/llama-swap-config.yaml` — model paths under `/models/...` map to `~/localAi/aimodels/...`.
- `config/waybar/scripts/temps.sh` — auto-detects hwmon sensors by driver name (k10temp/coretemp, amdgpu, nvme, spd5118), works on any machine; missing sensors show N/A.
- Monitor names/assignments (`HDMI-A-1`, `HDMI-A-2`, workspace split 7/3) match my setup.

## Pi voice dictation (STT)

`whisper-server` runs as a compose service (`tools` profile) from the official whisper.cpp image, sharing the pi container's network namespace so the endpoint stays at `127.0.0.1:8788` inside pi (pi-voice-stt rejects plain-HTTP endpoints that aren't loopback). The `pi` helper starts it if it's down. The model stays resident in RAM (~2 GB) — stop it with `docker compose -f ~/localAi/docker-compose.yaml --profile tools stop whisper` to free RAM (next `pi` call restarts it). In pi: **Ctrl+R** → talk → **Ctrl+R** → transcript in the editor.

One-time setup (after `install.sh`, on the host):

```sh
# model (~1.6 GB), fetched by the official image's helper into ~/localAi/whisper-models
docker run --rm -v ~/localAi/whisper-models:/models ghcr.io/ggml-org/whisper.cpp:main download-ggml-model.sh large-v3-turbo /models
# install the dictation extension (persists in pi-home)
docker exec pi pi install npm:pi-voice-stt
```

To update the whole pi+whisper stack (fresh base image, clean rebuild, full cleanup): `pi rebuild`. Mic access: the pi container mounts `/run/user/1000/pulse` (verify `native` socket exists and the host's PipeWire/PulseAudio daemon is alive); if your host's Pulse socket lives elsewhere or you use ALSA, adjust the mount in `config/localAI/docker-compose.yaml` and `capture.inputFormat` in `pi-home/agent/stt.json`. Whisper logs: `docker logs whisper`.
