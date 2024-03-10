#!/bin/bash
# from: https://apple.stackexchange.com/questions/87619/where-are-keyboard-shortcuts-stored-for-backup-and-sync-purposes
# cd $HOME/Library/Preferences

system_files=(
    "com.apple.symbolichotkeys.plist"
    "com.googlecode.iterm2.plist"
    "com.raycast.macos.plist"
)
for file in "${system_files[@]}"
do 
    if [[ -f "$HOME/Library/Preferences/$file" ]] && [[ -f "$HOME/.dotfiles/osx" ]]; then
        echo "cp $HOME/Library/Preferences/$file $HOME/.dotfiles/osx/$file" && cp $HOME/Library/Preferences/$file $HOME/.dotfiles/osx/$file
        # putil --convert xml1 symbolichotkeys.plist
    fi
done

if command -v mackup &>/dev/null; then
    # mackup을 사용하여 백업할 일이 있으면 그냥 가끔 한번씩 mackup bakcup && mackup uninstall로
    # 현 상태만 save하는 방식을 취하는 게 좋다. 그렇지 않으면 symlink가 걸려있으면 동작하지 않는다.
    # echo "[REQUIRED] mackup backup && mackup uninstall"
    # echo "mackup backup && mackup uninstall" && mackup backup && mackup uninstall
    echo "" &>/dev/null
fi
