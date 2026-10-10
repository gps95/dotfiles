#Full upgrade first
sudo pacman -Syu

packages=(
#Main hyprland and waybar stuff
kitty
wofi
waybar
dunst
hyprpaper

#Main programs
firefox
yazi
freecad
code
steam

#Main tools
git
docker
docker-compose
remmina 
bitwarden 
mullvad-vpn
emacs

#Useful cli stuff
dust
fastfetch
htop

#Fonts
ttf-nerd-fonts-symbols
ttf-iosevka-nerd
)

#Install programs
sudo pacman -Syu --needed "${packages[@]}"

#Add user to docker group(then reset or newgrp docker)
sudo usermod -aG docker $USER