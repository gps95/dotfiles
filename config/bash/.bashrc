#
# ~/.bashrc
#

# If not running interactively, don't do anything
[[ $- != *i* ]] && return
alias ls='ls --color=auto'
alias grep='grep --color=auto'

#Prompt: orange [user@host dir]$ , escape codes with 
#\u user, \h host, \W working dir, 0;33m orange color
PS1='\[\033[0;33m\][\u@\h \W ]\$\[\033[0m\] '

# Aliases
alias ll='ls -la'
alias cdy='ypick cd'

# Pi
# pi agent (docker sandbox in ~/localAi).
# Configure tools on the fly inside pi: /tools, /web, /bash (see tools.ts extension)
pi() {
  if [ "$1" = "update" ]; then
    docker exec pi pi update
  return
  fi

  # Clean container update: fresh base image, full rebuild, complete cleanup
  # (removes pi+whisper containers, pi-npm volume, old image, docker build cache)
  if [ "$1" = "rebuild" ] || [ "$1" = "containerupdate" ]; then
    local f=~/localAi/docker-compose.yaml
    echo "Cleaning up pi+whisper (containers + pi-npm volume + image + build cache)..."
    docker compose -f "$f" --profile tools down -v pi whisper || return 1
    docker rmi -f pi-sandbox >/dev/null 2>&1
    docker buildx prune -f >/dev/null
    echo "Rebuilding pi-sandbox (pulls fresh base image, no cache)..."
    docker compose -f "$f" --profile tools build --no-cache pi || return 1
    docker compose -f "$f" --profile tools up -d pi whisper || return 1
    # Re-sync dotfile-managed agent state (stt.json, models.json, extensions)
    cp -rf ~/dotfiles/config/localAI/pi-home/agent/. ~/localAi/pi-home/agent/
    # Stale static-ffmpeg workaround: the image ships apt ffmpeg now
    rm -f ~/localAi/pi-home/agent/bin/ffmpeg
    echo "pi + whisper rebuilt. Start with: pi"
  return
  fi

  if [ "$1" = "it" ]; then
    docker exec -it pi bash
  return
  fi

  PI_WORKDIR=$PWD docker compose -f ~/localAi/docker-compose.yaml --profile tools up -d pi whisper || return 1
  docker exec -it -u "$(id -u):$(id -g)" pi pi "$@"
}

# Pick a file with yazi, e.g. ypick cat, ypick code, ypick cd
ypick() {
  local tmp f
  tmp=$(mktemp)
  yazi --chooser-file "$tmp" >/dev/null && f=$(cat "$tmp")
  rm -f "$tmp"
  [[ -n $f ]] || return 1
  if [[ $# -eq 0 ]]; then
    echo "$f"
    return
  fi
  "$@" "$f"
}

# To make ctrl+r and tab fuzzy
eval "$(fzf --bash)"
