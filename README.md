# dotfiles

My Linux dotfiles: a Hyprland workstation setup with a fully local AI stack (llama-swap + a containerized pi agent harness) on an AMD GPU.

## Layout

```
config/
├── bash/        .bashrc (prompt, pi helper function)
├── dunst/       dunst notification config
├── fontconfig/  fonts.conf — Iosevka as default font system-wide
├── hyprland/    hyprland.lua (Lua config), hyprpaper.conf
├── kitty/       blue/orange kitty theme
├── localAI/     llama-swap docker-compose + models config, pi container,
│                pi-home/ (agent models.json + extensions)
├── waybar/      waybar config, style, temps script
└── wofi/        wofi app launcher config/style
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
- `config/waybar/scripts/temps.sh` — hwmon paths are hardcoded to my PCI topology; find yours under `/sys/devices/pci0000:00/` and adjust.
- Monitor names/assignments (`HDMI-A-1`, `HDMI-A-2`, workspace split 7/3) match my setup.
