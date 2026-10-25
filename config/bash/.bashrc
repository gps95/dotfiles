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

# Pi
# pi agent (docker sandbox in ~/localAi).
# Configure tools on the fly inside pi: /tools, /web, /bash (see tools.ts extension)
pi() {
  if [ "$1" = "update" ]; then
    docker exec pi pi update
  return
  fi

  if [ "$1" = "it" ]; then
    docker exec -it pi bash
  return
  fi

  PI_WORKDIR=$PWD docker compose -f ~/localAi/docker-compose.yaml --profile tools up -d pi || return 1
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
