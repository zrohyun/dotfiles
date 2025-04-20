#!/bin/bash
#             _                     
#            | |                    
#     _______| |__   ___ _ ____   __
#    |_  / __| '_ \ / _ \ '_ \ \ / /
#   _ / /\__ \ | | |  __/ | | \ V / 
#  (_)___|___/_| |_|\___|_| |_|\_/  

# FIRST INITIATED CONFIG FILE WHEN ZSH STARTS
export DOTFILES=$HOME/.dotfiles
# [[ -f ${XDG_CONFIG_HOME:-$HOME/.config}/.env ]] && source ${XDG_CONFIG_HOME:-$HOME/.config}/.env
[[ -f $DOTFILES/config/.env ]] && source $DOTFILES/config/.env


export ZSH_CONFIG_DIR=${XDG_CONFIG_HOME:-$HOME/.config}/zsh
export ZSH_CACHE_DIR=${XDG_CACHE_HOME:-$HOME/.cache}/zsh
export ZSH_STATE_DIR=${XDG_STATE_HOME:-$HOME/.local/state}/zsh

if [[ ! -d $ZSH_CACHE_DIR ]]; then
    \mkdir -vp $ZSH_CACHE_DIR
fi
if [[ ! -d $ZSH_STATE_DIR ]]; then
    \mkdir -vp $ZSH_STATE_DIR
fi

export PATH=$PATHL:/usr/sbin
# nerdfetch
if command -v nerdfetch &> /dev/null; then
    nerdfetch
fi