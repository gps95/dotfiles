#!/bin/bash

DOTFILES_DIR="$HOME/dotfiles"

echo "Creating symlinks..."

#Bash
ln -sf "$DOTFILES_DIR/config/bash/.bashrc" ~/.bashrc

#Dunst
ln -sf "$DOTFILES_DIR/config/dunst/dunstrc" ~/.config/dunst/dunstrc

#Emacs
ln -sf "$DOTFILES_DIR/config/emacs/init.el" ~/.config/emacs/init.el

#Hyprland
mkdir -p ~/.config/hypr
ln -sf "$DOTFILES_DIR/config/hyprland/hyprland.lua" ~/.config/hypr/hyprland.lua
ln -sf "$DOTFILES_DIR/config/hyprland/hyprland.conf" ~/.config/hypr/hyprland.conf
ln -sf "$DOTFILES_DIR/config/hyprland/hyprpaper.conf" ~/.config/hypr/hyprpaper.conf

#Kitty
mkdir -p ~/.config/kitty
ln -sf "$DOTFILES_DIR/config/kitty/kitty.conf" ~/.config/kitty/kitty.conf

#LocalAI (llama-swap,pi harness)
LOCALAIDIR=localAi
mkdir -p ~/$LOCALAIDIR
ln -sf "$DOTFILES_DIR/config/localAI/.env" ~/$LOCALAIDIR/.env
ln -sf "$DOTFILES_DIR/config/localAI/docker-compose.yaml" ~/$LOCALAIDIR/docker-compose.yaml
ln -sf "$DOTFILES_DIR/config/localAI/llama-swap-config.yaml" ~/$LOCALAIDIR/llama-swap-config.yaml
ln -sf "$DOTFILES_DIR/config/localAI/switch.sh" ~/$LOCALAIDIR/switch.sh
#mkdir -p ~/$LOCALAIDIR/diffuse
#ln -sf "$DOTFILES_DIR/config/localAI/diffuse/Dockerfile" ~/$LOCALAIDIR/diffuse/Dockerfile
mkdir -p ~/$LOCALAIDIR/pi
mkdir -p ~/$LOCALAIDIR/pi-home/agent
ln -sf "$DOTFILES_DIR/config/localAI/pi/Dockerfile" ~/$LOCALAIDIR/pi/Dockerfile
ln -sf "$DOTFILES_DIR/config/localAI/pi/models.json" ~/$LOCALAIDIR/pi-home/agent/models.json

#Waybar
mkdir -p ~/.config/waybar
ln -sf "$DOTFILES_DIR/config/waybar/config.jsonc" ~/.config/waybar/config.jsonc
ln -sf "$DOTFILES_DIR/config/waybar/style.css" ~/.config/waybar/style.css
rm -rf ~/.config/waybar/scripts
ln -sf "$DOTFILES_DIR/config/waybar/scripts" ~/.config/waybar/scripts

#Wofi
mkdir -p ~/.config/wofi
ln -sf "$DOTFILES_DIR/config/wofi/config" ~/.config/wofi/config
ln -sf "$DOTFILES_DIR/config/wofi/style.css" ~/.config/wofi/style.css

echo "Symlinks done,reloading hyprland"

hyprctl reload

echo "Dotfiles updated"
