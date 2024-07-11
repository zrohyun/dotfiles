#!/bin/bash

# export XDG_CONFIG_HOME="$HOME/.config"
if command -v curl &> /dev/null; then
    nerdfetch() {
        curl -fsSL https://raw.githubusercontent.com/ThatOneCalculator/NerdFetch/main/nerdfetch | sh -s -- ${1:--c}
    }
    # curl -fsSL https://raw.githubusercontent.com/ThatOneCalculator/NerdFetch/main/nerdfetch | sh
    nerdfetch
    alias nerdfetch=nerdfetch
    alias neofetch=nerdfetch
fi

# export XDG_CONFIG_HOME="$HOME/.config"
