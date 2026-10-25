#!/bin/bash

DOTFILES_DIR="$HOME/dotfiles"

echo "Creating symlinks..."

#Bash
ln -sf "$DOTFILES_DIR/config/bash/.bashrc" ~/.bashrc

#Dunst
ln -sf "$DOTFILES_DIR/config/dunst/dunstrc" ~/.config/dunst/dunstrc

#Fontconfig (Iosevka as default font)
mkdir -p ~/.config/fontconfig
ln -sf "$DOTFILES_DIR/config/fontconfig/fonts.conf" ~/.config/fontconfig/fonts.conf

#Hyprland
mkdir -p ~/.config/hypr
ln -sf "$DOTFILES_DIR/config/hyprland/hyprland.lua" ~/.config/hypr/hyprland.lua
ln -sf "$DOTFILES_DIR/config/hyprland/hyprpaper.conf" ~/.config/hypr/hyprpaper.conf
ln -sfn "$DOTFILES_DIR/config/hyprland/BACKGROUND" ~/BACKGROUND

#Kitty
mkdir -p ~/.config/kitty
ln -sf "$DOTFILES_DIR/config/kitty/kitty.conf" ~/.config/kitty/kitty.conf

#LocalAI (llama-swap,pi harness)
LOCALAIDIR=localAi
mkdir -p ~/$LOCALAIDIR
ln -sf "$DOTFILES_DIR/config/localAI/.env" ~/$LOCALAIDIR/.env
ln -sf "$DOTFILES_DIR/config/localAI/docker-compose.yaml" ~/$LOCALAIDIR/docker-compose.yaml
ln -sf "$DOTFILES_DIR/config/localAI/llama-swap-config.yaml" ~/$LOCALAIDIR/llama-swap-config.yaml
mkdir -p ~/$LOCALAIDIR/pi
ln -sf "$DOTFILES_DIR/config/localAI/pi/Dockerfile" ~/$LOCALAIDIR/pi/Dockerfile
#Pi agent state (models.json + extensions), merged over runtime dir so pi sessions are kept
mkdir -p ~/$LOCALAIDIR/pi-home
cp -rf "$DOTFILES_DIR/config/localAI/pi-home/agent" ~/$LOCALAIDIR/pi-home/agent

#Yazi
mkdir -p ~/.config/yazi
ln -sf "$DOTFILES_DIR/config/yazi/yazi.toml" ~/.config/yazi/yazi.toml
ln -sf "$DOTFILES_DIR/config/yazi/theme.toml" ~/.config/yazi/theme.toml

#Waybar
mkdir -p ~/.config/waybar
ln -sf "$DOTFILES_DIR/config/waybar/config.jsonc" ~/.config/waybar/config.jsonc
ln -sf "$DOTFILES_DIR/config/waybar/style.css" ~/.config/waybar/style.css
rm -rf ~/.config/waybar/scripts ~/.config/waybar/custom_modules
ln -sf "$DOTFILES_DIR/config/waybar/scripts" ~/.config/waybar/scripts
ln -sf "$DOTFILES_DIR/config/waybar/custom_modules" ~/.config/waybar/custom_modules

#Wofi
mkdir -p ~/.config/wofi
ln -sf "$DOTFILES_DIR/config/wofi/config" ~/.config/wofi/config
ln -sf "$DOTFILES_DIR/config/wofi/style.css" ~/.config/wofi/style.css

#SDDM (blue/orange theme + wallpaper; needs sudo)
if command -v sudo >/dev/null 2>&1; then
    echo "Installing SDDM theme (needs sudo)..."
    sudo mkdir -p /usr/local/share/sddm/themes/blueorange /etc/sddm.conf.d
    sudo cp -r "$DOTFILES_DIR/config/sddm/theme/blueorange/." /usr/local/share/sddm/themes/blueorange/
    sudo tee /etc/sddm.conf.d/90-dotfiles.conf >/dev/null <<EOF
[Theme]
Current=blueorange
Wallpaper=$HOME/BACKGROUND
EOF
else
    echo "sudo not found, skipping SDDM theme"
fi

echo "Symlinks done,reloading hyprland"

hyprctl reload

echo "Dotfiles updated"
