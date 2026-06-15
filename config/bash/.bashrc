#
# ~/.bashrc
#

# If not running interactively, don't do anything
[[ $- != *i* ]] && return
alias ls='ls --color=auto'
alias grep='grep --color=auto'

#Prompt config
#PS1='[\u@\h \W]\$ ' #Default
PS1='\[\033[0;33m\][\u@\h \W ]\$\[\033[0m\] '
#\[\033[0;33m to specify format:
##0;33m for orange color

#special chars:
##\u -> user
##\h -> host
##\W -> current working directory

#\[\033[0m to change the following format to white

#You have to escape most stuff with \

#To autostart the ssh-agent for git:
eval $(keychain --eval --quiet githubgps95)