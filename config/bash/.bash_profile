#!/bin/bash

# Homebrew setup for different platforms
if command -v brew &>/dev/null; then
  eval "$($(which brew) shellenv)"
elif [[ -f /opt/homebrew/bin/brew ]]; then
  # Apple Silicon Mac
  eval "$(/opt/homebrew/bin/brew shellenv)"
elif [[ -f /usr/local/bin/brew ]]; then
  # Intel Mac
  eval "$(/usr/local/bin/brew shellenv)"
elif [[ -f /home/linuxbrew/.linuxbrew/bin/brew ]]; then
  # Linux
  eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
fi

