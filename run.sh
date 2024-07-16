#!/bin/bash

exec 3>&1 1>"log.log" 2>&1
# set -x
set -v

main() {
    echo "HI"
}
date -Is
main
echo "creating a temporary directory and some files"
TEMPDIR=$(mktemp -d)
touch $TEMPDIR/testfile{00..09}
# touch /not-existing-directory/testfile
# echo "TEST"

# # 옵션 파싱
# # while getopts "ug:" opt; do
# #     case $opt in
# #         u) update_flag=true; echo "up" ;;  # -u 플래그가 설정되면 update_flag를 true로 설정
# #         g) upgrade_flag=true; echo "ug" ;;  # -g 플래그가 설정되면 upgrade_flag를 true로 설정
# #         *) echo "Usage: $0 [-u] [-g]" >&2
# #         exit 1 ;;
# #     esac
# # done
# # shift $((OPTIND - 1))
# # args=("$@")
# # echo 'hi'

# # echo "${args[*]}"
# set -x
# # eval "[[ ! -d $HOME/.tmp ]] && sleep 10 && git clone https://github.com/ohmyzsh/ohmyzsh.git ./tmp &> /dev/null" & disown
# sudo apt install -y neofetch tig &>> ./tmp/log.log 2>&1 & disown
# echo "HI"
# sudo apt install -y jq ripgrep &>> ./tmp/log.log 2>&1 & disown
# pass
# echo "HI"

# if false; then
#     echo "HI"
# # else
# #     pass
# fi