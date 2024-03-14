#!/bin/bash
# from: https://apple.stackexchange.com/questions/87619/where-are-keyboard-shortcuts-stored-for-backup-and-sync-purposes
# cd $HOME/Library/Preferences
# 설정이 바뀔때마다 가끔 실행시켜주기

system_files=(
    "com.apple.symbolichotkeys.plist"
    "com.googlecode.iterm2.plist"
    "com.raycast.macos.plist"
)
for file in "${system_files[@]}"
do 
    if [[ -f "$HOME/Library/Preferences/$file" ]] && [[ -d "$HOME/.dotfiles/osx" ]]; then
        echo "cp $HOME/Library/Preferences/$file $HOME/.dotfiles/osx/$file" && cp $HOME/Library/Preferences/$file $HOME/.dotfiles/osx/$file
        # plutil -convert xml1 symbolichotkeys.plist
    fi
done

if command -v mackup &>/dev/null; then
    # mackup을 사용하여 백업할 일이 있으면 그냥 가끔 한번씩 mackup bakcup && mackup uninstall로
    # 현 상태만 save하는 방식을 취하는 게 좋다. 그렇지 않으면 symlink가 걸려있으면 동작하지 않는다.
    # echo "[REQUIRED] mackup backup && mackup uninstall"
    echo "mackup backup && mackup uninstall" && mackup backup && mackup uninstall
    #TODO: VSCODE 설정을 mackup 혹은 symlink로 설정해놓아야하나..? (근데 code는 이미 github으로 백업이 되고 있기는 한데)
    # echo "" &>/dev/null
fi

# COPY ALL SYSTEM SETTINGS (그냥 단발성 백업)
# cp -r $HOME/Library/Preferences $HOME/.dotfiles/osx && tar -zcvf $HOME/.dotfiles/osx/Library-Preferences.tar.gz $HOME/.dotfiles/osx/Preferences # && rm $HOME/.dotfiles/osx/Preferences
