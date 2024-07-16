#!/bin/bash

if command -v brew &>/dev/null; then
  eval "$($(which brew) shellenv)"
elif [[ -f /opt/homebrew/bin/brew ]]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
elif [[ -f /usr/local/bin/brew ]]; then
  eval "$(/usr/local/bin/brew shellenv)"
fi

# alias neofetch='f() {curl -fsSL https://raw.githubusercontent.com/ThatOneCalculator/NerdFetch/main/nerdfetch | sh -s -- ${1:--c}}; f;'
# neofetch