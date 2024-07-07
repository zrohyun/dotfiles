#!/bin/bash

# export XDG_CONFIG_HOME="$HOME/.config"
alias neofetch='f() {curl -fsSL https://raw.githubusercontent.com/ThatOneCalculator/NerdFetch/main/nerdfetch | sh -s -- ${1:--c}}; f'
neofetch