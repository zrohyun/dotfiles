#!/usr/bin/env bash

# ============================================
# init.sh - 함수 초기화
# ============================================
# logging.sh가 먼저 로드된 후 호출되어야 함
# safe_source, log_* 함수 사용 가능
#
# 로드 순서: logging.sh → init.sh → main()

# ============================================
# 필수 함수 파일 목록
# ============================================
readonly INIT_REQUIRED_FUNCTIONS=(
    "./config/functions/install_dependencies.sh"
    "./config/functions/setup_config.sh"
    "./config/functions/backup.sh"
    "./config/functions/snapshot.sh"
    "./config/functions/functions.sh"
)

# ============================================
# 함수 로드
# ============================================
load_functions() {
    log_debug "함수 파일 로드 시작..."
    
    # 필수 함수 파일 로드
    for func_file in "${INIT_REQUIRED_FUNCTIONS[@]}"; do
        safe_source "$func_file"
    done
    
    # OS별 설정 로드
    local machine
    machine=$(detect_os)
    
    if [[ $machine == "Linux" ]]; then
        safe_source ./config/functions/setup_linux.sh
    elif [[ $machine == "Mac" ]]; then
        safe_source ./config/functions/setup_mac.sh
    fi
    
    log_success "모든 함수 파일 로드 완료"
}

# ============================================
# 초기화 실행
# ============================================
load_functions

