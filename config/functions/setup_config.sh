#!/usr/bin/env bash

# .secrets.local 파일 생성 함수
create_secrets_local() {
    local secrets_template="${DOTFILES}/config/.secrets"
    local secrets_local="$HOME/.config/.secrets.local"
    
    # .config 디렉토리가 없으면 생성
    mkdir -p "$HOME/.config"
    
    # .secrets.local 파일이 이미 존재하는지 확인
    if [[ -f "$secrets_local" ]]; then
        log_success ".secrets.local 파일이 이미 존재합니다: $secrets_local"
        return 0
    fi
    
    # 템플릿 파일이 존재하는지 확인
    if [[ ! -f "$secrets_template" ]]; then
        log_error ".secrets 템플릿 파일을 찾을 수 없습니다: $secrets_template"
        return 1
    fi
    
    # 템플릿을 .secrets.local로 복사
    if ! cp "$secrets_template" "$secrets_local"; then
        log_error ".secrets.local 파일 생성 실패"
        return 1
    fi
    
    # 파일 권한 설정 (600 - 소유자만 읽기/쓰기)
    chmod 600 "$secrets_local"
    
    log_success ".secrets.local 파일을 생성했습니다: $secrets_local"
    log "이제 $secrets_local 파일을 편집하여 실제 환경변수 값을 입력하세요."
    log "예: export OPENAI_API_KEY=your_actual_api_key_here"
}

# 로컬 설정 파일 설정
setup_local_config() {
    log "로컬 설정 파일 설정 중..."
    
    local local_dir="$HOME/.dotlocal"
    local dotfiles_dotlocal_dir="${DOTFILES}/dotlocal"
    
    # dotfiles/dotlocal/.local.env 생성 (example에서 복사, 없을 때만)
    if [[ ! -f "$dotfiles_dotlocal_dir/.local.env" ]]; then
        if [[ -f "$dotfiles_dotlocal_dir/.local.env.example" ]]; then
            if cp "$dotfiles_dotlocal_dir/.local.env.example" "$dotfiles_dotlocal_dir/.local.env"; then
                log "Created dotfiles .local.env from example"
            else
                log_error ".local.env 파일 생성 실패"
            fi
        fi
    fi
    
    # dotfiles/dotlocal/.local.sh 생성 (example에서 복사, 없을 때만)
    if [[ ! -f "$dotfiles_dotlocal_dir/.local.sh" ]]; then
        if [[ -f "$dotfiles_dotlocal_dir/.local.sh.example" ]]; then
            if cp "$dotfiles_dotlocal_dir/.local.sh.example" "$dotfiles_dotlocal_dir/.local.sh"; then
                log "Created dotfiles .local.sh from example"
            else
                log_error ".local.sh 파일 생성 실패"
            fi
        fi
    fi
    
    # 기존 .dotlocal 디렉토리 백업 (심볼릭 링크가 아닌 경우)
    if [[ -d "$local_dir" && ! -L "$local_dir" ]]; then
        if ! command -v backup_file_to_bak &>/dev/null; then
            log_error "backup_file_to_bak 함수를 찾을 수 없습니다"
            return 1
        fi
        backup_file_to_bak "$local_dir"
        rm -rf "$local_dir"  # 기존 디렉토리 제거
    elif [[ -L "$local_dir" ]]; then
        # 이미 심볼릭 링크인 경우 제거
        rm -f "$local_dir"
    fi
    
    # dotlocal 폴더 전체를 .dotlocal로 심볼릭 링크
    if ! ln -sf "$dotfiles_dotlocal_dir" "$local_dir"; then
        log_error ".dotlocal 심볼릭 링크 생성 실패"
        return 1
    fi
    
    log_success "로컬 설정 파일 설정 완료"
}
