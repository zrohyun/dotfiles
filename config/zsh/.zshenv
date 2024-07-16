#!/bin/bash

[[ -f ${XDG_CONFIG_HOME:-$HOME/.config}/.env ]] && source ${XDG_CONFIG_HOME:-$HOME/.config}/.env

export ZSH_CONFIG_DIR=${XDG_CONFIG_HOME:-$HOME/.config}/zsh
export ZSH_CACHE_DIR=${XDG_CACHE_HOME:-$HOME/.cache}/zsh
export ZSH_STATE_DIR=${XDG_STATE_HOME:-$HOME/.local/state}/zsh
if [[ ! -d $ZSH_CACHE_DIR ]]; then
    \mkdir -vp $ZSH_CACHE_DIR
fi
if [[ ! -d $ZSH_STATE_DIR ]]; then
    \mkdir -vp $ZSH_STATE_DIR
fi

# nerdfetch
if command -v nerdfetch &> /dev/null; then
    nerdfetch
fi