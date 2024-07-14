#!/bin/bash

[[ -f ${XDG_CONFIG_HOME:-$HOME}/.env ]] && source ${XDG_CONFIG_HOME:-$HOME}/.env

export ZSH_CONFIG_DIR=$XDG_CONFIG_HOME/zsh
export ZSH_CACHE_DIR=$XDG_CACHE_HOME/zsh
if [[ ! -d $ZSH_CACHE_DIR ]]; then
    mkdir -p $ZSH_CACHE_DIR
fi