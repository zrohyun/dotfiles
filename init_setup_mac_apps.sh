#!/bin/bash

#   _           _  _                _                                                
#  (_)         (_)| |              | |                                               
#   _  _ __     _ | |_   ___   ___ | |_  _   _  _ __    _ __ ___    __ _   ___      
#  | || '_ \   | || __| / __| / _ \| __|| | | || '_ \  | '_ ` _ \  / _` | / __|     
#  | || | | |  | || |_ _\__ \|  __/| |_ | |_| || |_) | | | | | | || (_| || (__      
#  |_||_| |_|  |_| \__(_)___/ \___| \__| \__,_|| .__/  |_| |_| |_| \__,_| \___|     
#                                              | |                                   
#                                              |_|                                   
#
# Mac용 앱 초기 설치 스크립트
# 
# 실행 방법: ./init_setup_mac_apps.sh

# 로깅 초기화 함수
init_logging() {
    # 현재 스크립트의 디렉토리 확인
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local dotfiles_dir="$script_dir"
    local log_dir="$dotfiles_dir/.log"
    
    # 로그 디렉토리가 없으면 생성
    mkdir -p "$log_dir"
    
    # 로그 파일 설정
    LOGFILE="${log_dir}/init_setup_mac_apps_$(date +%Y%m%d_%H%M%S).log"
    echo "로그 파일: $LOGFILE"
    
    # 모든 출력을 로그 파일과 터미널에 동시에 기록
    exec > >(tee -a "$LOGFILE") 2>&1
}

# 로깅 초기화
init_logging

# 현재 스크립트의 디렉토리 확인
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Brewfile 경로 설정
BREWFILE_PATH="$SCRIPT_DIR/config/osx/Brewfile"

echo "$(date +"%Y-%m-%d %H:%M:%S") - Brewfile을 사용하여 앱 설치 중..."
brew bundle --file="$BREWFILE_PATH"

if [ $? -eq 0 ]; then
    echo "$(date +"%Y-%m-%d %H:%M:%S") - ✅ 앱 설치 완료"
else
    echo "$(date +"%Y-%m-%d %H:%M:%S") - ❌ 일부 앱 설치 중 오류가 발생했습니다."
fi

echo "$(date +"%Y-%m-%d %H:%M:%S") - ✅ 모든 작업이 완료되었습니다."
