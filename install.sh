#!/bin/bash

DOTFILES_DIR="$HOME/dotfiles"

echo "Creating symlinks..."

#Hyprland
mkdir -p ~/.config/hypr
ln -sf "$DOTFILES_DIR/config/hyprland/hyprland.conf" ~/.config/hypr/hyprland.conf

#Waybar
mkdir -p ~/.config/waybar
ln -sf "$DOTFILES_DIR/config/waybar/config.jsonc" ~/.config/waybar/config.jsonc
ln -sf "$DOTFILES_DIR/config/waybar/style.css" ~/.config/waybar/style.css
rm -rf ~/.config/waybar/scripts
ln -sf "$DOTFILES_DIR/config/waybar/scripts" ~/.config/waybar/scripts

echo "Symlinks done,reloading hyprland"

hyprctl reload

echo "Dotfiles updated"
