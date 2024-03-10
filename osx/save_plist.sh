#!/bin/bash
# from: https://apple.stackexchange.com/questions/87619/where-are-keyboard-shortcuts-stored-for-backup-and-sync-purposes
cd $HOME/Library/Preferences

if [[ -f com.apple.symbolichotkeys.plist ]]; then
    echo "cp com.apple.symbolichotkeys.plist $HOME/.dotfiles/osx/com.apple.symbolichotkeys.plist" && cp com.apple.symbolichotkeys.plist $HOME/.dotfiles/osx/com.apple.symbolichotkeys.plist
    # putil --convert xml1 symbolichotkeys.plist 
fi

if [[ -f com.googlecode.iterm2.plist ]]; then
    echo "cp com.googlecode.iterm2.plist $HOME/.dotfiles/osx/com.googlecode.iterm2.plist" && cp com.googlecode.iterm2.plist $HOME/.dotfiles/osx/com.googlecode.iterm2.plist
    # putil --convert xml1 symbolichotkeys.plist 
fi 