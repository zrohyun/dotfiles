#!/bin/bash
# from: https://apple.stackexchange.com/questions/87619/where-are-keyboard-shortcuts-stored-for-backup-and-sync-purposes
cd $HOME/Library/Preferences

if [[ -f com.apple.symbolichotkeys.plist]]; then
    #! mackup으로 대체 (Deprecated)
    echo "Symbolic hotkeys already installed"
    cp com.apple.symbolichotkeys.plist $HOME/symbolichotkeys.plist
    putil --convert xml1 symbolichotkeys.plist 
fi 