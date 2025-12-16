#!/bin/bash

source ./config/functions/functions.sh

# set_default_shell_zsh(){
#     if command -v zsh &> /dev/null; then
#         if ! exec_with_auto_privilege chsh -s $(which zsh); then
#             echo "Error: Failed to set zsh as default shell"
#         fi
#     fi
# }

setup_linux(){
    export DEBIAN_FRONTEND="noninteractive"

    # 시스템 업데이트
    install_cli_tools -u -g

    # 최소 필수 도구 설치 (INSTALL_PLAN_MINIMAL)
    echo "Installing essential tools with apt-get..."
    essential_tools=(tzdata git curl vim zsh)
    install_cli_tools "${essential_tools[@]}"

    # tzdata 설치 후 시스템 타임존 설정 (Asia/Seoul) - tzdata를 먼저 설치해야 /usr/share/zoneinfo/ 디렉토리가 생성됨
    exec_with_auto_privilege ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime

    echo "✅ 기본 설치 완료! 추가 도구는 ./config/functions/tools.sh --dev/--advanced/--all 로 설치하세요."
}

