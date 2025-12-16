#!/usr/bin/env bash

# 모드 타입 정의
readonly MODE_CURL="curl"
readonly MODE_LOCAL="local"

# 설치 모드 감지
detect_install_mode() {
    # DOTFILES_INTERNAL_SOURCE가 설정되어 있으면 로컬 모드
    if [[ -n "${DOTFILES_INTERNAL_SOURCE:-}" ]]; then
        echo "$MODE_LOCAL"
        return 0
    fi
    
    # .git 디렉토리가 존재하면 로컬 모드
    if [[ -e "./.git" ]]; then
        echo "$MODE_LOCAL"
        return 0
    fi
    
    # 그 외의 경우는 curl 모드
    echo "$MODE_CURL"
    return 0
}

# 모드 확인 헬퍼 함수
is_curl_mode() {
    [[ "$(detect_install_mode)" == "$MODE_CURL" ]]
}

is_local_mode() {
    [[ "$(detect_install_mode)" == "$MODE_LOCAL" ]]
}
