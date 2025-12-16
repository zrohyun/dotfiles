# ~/.bashrc: executed by bash(1) for non-login shells.
# see /usr/share/doc/bash/examples/startup-files (in the package bash-doc)
# for examples

# If not running interactively, don't do anything
[ -z "$PS1" ] && return

# don't put duplicate lines or lines starting with space in the history.
# See bash(1) for more options
HISTCONTROL=ignoreboth

# append to the history file, don't overwrite it
shopt -s histappend

# for setting history length see HISTSIZE and HISTFILESIZE in bash(1)
HISTSIZE=1000
HISTFILESIZE=2000

# check the window size after each command and, if necessary,
# update the values of LINES and COLUMNS.
shopt -s checkwinsize

# If set, the pattern "**" used in a pathname expansion context will
# match all files and zero or more directories and subdirectories.
#shopt -s globstar

# make less more friendly for non-text input files, see lesspipe(1)
[ -x /opt/bin/lesspipe ] && eval "$(SHELL=/system/bin/sh lesspipe)"

# Using color promt
if [[ ${EUID} == 0 ]] ; then
    PS1='\[\033[48;2;221;75;57;38;2;255;255;255m\] \$ \[\033[48;2;0;135;175;38;2;221;75;57m\]\[\033[48;2;0;135;175;38;2;255;255;255m\] \h \[\033[48;2;83;85;85;38;2;0;135;175m\]\[\033[48;2;83;85;85;38;2;255;255;255m\] \w \[\033[49;38;2;83;85;85m\]\[\033[00m\] '
else
    PS1='\[\033[48;2;105;121;16;38;2;255;255;255m\] \$ \[\033[48;2;0;135;175;38;2;105;121;16m\]\[\033[48;2;0;135;175;38;2;255;255;255m\] \u@\h \[\033[48;2;83;85;85;38;2;0;135;175m\]\[\033[48;2;83;85;85;38;2;255;255;255m\] \w \[\033[49;38;2;83;85;85m\]\[\033[00m\] '
fi
# Some better definitions
alias cp="cp -i"                          # confirm before overwriting something
alias df='df -h'                          # human-readable sizes
alias free='free -m'                      # show sizes in MB
alias more=less

#
# # ex - archive extractor
# # usage: ex <file>
ex ()
{
  if [ -f $1 ] ; then
    case $1 in
      *.tar.bz2)   tar xjf $1   ;;
      *.tar.gz)    tar xzf $1   ;;
      *.bz2)       bunzip2 $1   ;;
      *.rar)       unrar x $1     ;;
      *.gz)        gunzip $1    ;;
      *.tar)       tar xf $1    ;;
      *.tbz2)      tar xjf $1   ;;
      *.tgz)       tar xzf $1   ;;
      *.zip)       unzip $1     ;;
      *.Z)         uncompress $1;;
      *.7z)        7z x $1      ;;
      *)           echo "'$1' cannot be extracted via ex()" ;;
    esac
  else
    echo "'$1' is not a valid file"
  fi
}

# enable color support of ls and also add handy aliases
if [ -x /opt/bin/dircolors ]; then
    test -r ~/.dircolors && eval "$(dircolors -b ~/.dircolors)" || eval "$(dircolors -b)"
    alias ls='ls --color=auto'
    #alias dir='dir --color=auto'
    #alias vdir='vdir --color=auto'

    alias grep='grep --color=auto'
    alias fgrep='fgrep --color=auto'
    alias egrep='egrep --color=auto'
fi

# some more ls aliases
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'

# Directory navigation aliases (zsh의 oh-my-zsh aliases plugin과 동일)
alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'
alias -- -='cd -'  # 이전 디렉토리로 이동

# Command location aliases
alias w='which'  # which 단축
alias t='type'   # type 단축

# Alias definitions.
# You may want to put all your additions into a separate file like
# ~/.bash_aliases, instead of adding them here directly.
# See /usr/share/doc/bash-doc/examples in the bash-doc package.

if [ -f ~/.bash_aliases ]; then
    . $HOME/.bash_aliases
fi

# enable programmable completion features (you don't need to enable
# this, if it's already enabled in /etc/bash.bashrc and /etc/profile
# sources /etc/bash.bashrc).
if ! shopt -oq posix; then
    # System bash_completion
    if [ -f /opt/etc/bash_completion ]; then
        . /opt/etc/bash_completion
    elif [ -f /usr/share/bash-completion/bash_completion ]; then
        . /usr/share/bash-completion/bash_completion
    elif [ -f /etc/bash_completion ]; then
        . /etc/bash_completion
    fi
    
    # Homebrew bash completion (Mac)
    if [[ "$OSTYPE" == "darwin"* ]] && command -v brew &>/dev/null; then
        brew_prefix=$(brew --prefix 2>/dev/null)
        if [ -n "$brew_prefix" ] && [ -f "$brew_prefix/etc/bash_completion" ]; then
            . "$brew_prefix/etc/bash_completion"
        fi
    fi
    
    # Custom completions
    if [ -d "${XDG_CONFIG_HOME:-$HOME/.config}/bash/completions" ]; then
        for completion_file in "${XDG_CONFIG_HOME:-$HOME/.config}/bash/completions"/*; do
            [ -f "$completion_file" ] && . "$completion_file"
        done
    fi
fi

# Enhanced completion settings
if [[ ${BASH_VERSION%%.*} -ge 4 ]]; then
    # Case-insensitive completion
    bind "set completion-ignore-case on" 2>/dev/null
    # Show all completions immediately
    bind "set show-all-if-ambiguous on" 2>/dev/null
    # Menu completion
    bind "set menu-complete-display-prefix on" 2>/dev/null
fi

# bash users - add the following line to your ~/.bashrc
# eval "$(direnv hook bash)"
[[ -f ${XDG_CONFIG_HOME:-$HOME}/.env ]] && source ${XDG_CONFIG_HOME:-$HOME}/.env
[[ -f ${XDG_CONFIG_HOME:-$HOME/.config}/.env ]] && source ${XDG_CONFIG_HOME:-$HOME/.config}/.env

export BASH_CACHE_DIR=${XDG_CACHE_HOME:-$HOME/.cache}/bash
if [[ ! -d $BASH_CACHE_DIR ]]; then
    mkdir -p $BASH_CACHE_DIR 2>/dev/null || true
fi
export HISTFILE=$BASH_CACHE_DIR/.bash_history
# export HISTFILE="$XDG_STATE_HOME"/bash/history

[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh

# 사용자별 추가 설정 (선택적)
if [[ -f "$HOME/.local/bin/env" ]]; then
    source "$HOME/.local/bin/env"
fi
