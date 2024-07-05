#!/bin/bash

# From: https://github.com/catppuccin/k9s
# Linux
OUT="${XDG_CONFIG_HOME:-$HOME/.config}/k9s/skins"
# Macos
OUT="${XDG_CONFIG_HOME:-$HOME/Library/Application Support}/k9s/skins"


mkdir -p "$OUT"
curl -L https://github.com/catppuccin/k9s/archive/main.tar.gz | tar x -C "$OUT" --strip-components=2 k9s-main/dist

# From: https://github.com/getomni/k9s
# curl https://raw.githubusercontent.com/getomni/k9s/main/skin.yml > ~/.k9s/skin.yml