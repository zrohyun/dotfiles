#!/bin/bash
# Description: 개인 스크립트 관리 함수들
# Author: zrohyun
# Created: 2025-01-19

# 스크립트 관리 설정
SCRIPTS_DIR="$HOME/.dotfiles/scripts"
LOCAL_BIN_DIR="$HOME/.dotfiles/local/bin"
HOME_BIN_DIR="$HOME/.bin"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 로깅 함수들
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ~/.bin 심볼릭 링크 설정
setup_personal_bin() {
    log_info "개인 스크립트 환경 설정 중..."
    
    # 필요한 디렉토리 생성
    mkdir -p "$LOCAL_BIN_DIR"
    
    # 기존 ~/.bin 처리
    if [[ -d "$HOME_BIN_DIR" && ! -L "$HOME_BIN_DIR" ]]; then
        log_warning "기존 ~/.bin 디렉토리가 발견되었습니다:"
        ls -la "$HOME_BIN_DIR"
        echo
        
        read -p "기존 파일들을 보존하면서 병합하시겠습니까? (Y/n): " -n 1 -r
        echo
        
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            # 기존 파일들을 dotfiles로 병합
            log_info "기존 파일들을 dotfiles 구조로 병합 중..."
            if [[ -n "$(ls -A "$HOME_BIN_DIR" 2>/dev/null)" ]]; then
                cp -r "$HOME_BIN_DIR"/* "$LOCAL_BIN_DIR/" 2>/dev/null || true
            fi
            
            # 백업 생성
            local backup_name="${HOME_BIN_DIR}.bak.$(date +%Y%m%d_%H%M%S)"
            mv "$HOME_BIN_DIR" "$backup_name"
            log_success "기존 ~/.bin을 백업했습니다: $backup_name"
        else
            log_error "설치를 중단합니다"
            return 1
        fi
    fi
    
    # 심볼릭 링크 생성
    ln -sfn "$LOCAL_BIN_DIR" "$HOME_BIN_DIR"
    log_success "~/.bin -> ~/.dotfiles/local/bin 심볼릭 링크 생성"
    
    # PATH 확인
    if [[ ":$PATH:" != *":$HOME/.bin:"* ]]; then
        log_warning "~/.bin이 PATH에 포함되어 있지 않습니다."
        log_info "쉘을 재시작하거나 'source ~/.zshrc' (또는 ~/.bashrc)를 실행하세요."
    else
        log_success "~/.bin이 PATH에 포함되어 있습니다."
    fi
}

# 새 스크립트 생성
create_script() {
    local name="$1"
    local category="${2:-personal}"
    
    if [[ -z "$name" ]]; then
        log_error "스크립트 이름을 입력해주세요."
        echo "사용법: create_script <이름> [카테고리]"
        echo "카테고리: personal, work, utils (기본값: personal)"
        return 1
    fi
    
    # 유효한 카테고리 확인
    case "$category" in
        personal|work|utils)
            ;;
        *)
            log_error "유효하지 않은 카테고리: $category"
            echo "사용 가능한 카테고리: personal, work, utils"
            return 1
            ;;
    esac
    
    local script_dir="$SCRIPTS_DIR/$category"
    local script_path="$script_dir/${name}.sh"
    
    # 이미 존재하는지 확인
    if [[ -f "$script_path" ]]; then
        log_error "스크립트가 이미 존재합니다: $script_path"
        return 1
    fi
    
    # 디렉토리 생성
    mkdir -p "$script_dir"
    
    # 템플릿 생성
    cat > "$script_path" << EOF
#!/bin/bash
# Description: ${name} script
# Author: zrohyun
# Created: $(date +%Y-%m-%d)
# Category: ${category}

set -euo pipefail

# 메인 함수
main() {
    echo "Hello from ${name} script!"
    echo "Category: ${category}"
    echo "Created: $(date +%Y-%m-%d)"
    
    # TODO: 스크립트 로직을 여기에 구현하세요
    
    echo "✅ ${name} 스크립트 실행 완료"
}

# 도움말 함수
show_help() {
    cat << HELP_EOF
Usage: \$(basename "\$0") [OPTIONS]

${name} - ${category} script

Options:
    -h, --help    Show this help message

Examples:
    \$(basename "\$0")        # Run the script
HELP_EOF
}

# 인자 처리
case "\${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main "\$@"
        ;;
esac
EOF
    
    # 실행 권한 설정
    chmod +x "$script_path"
    
    log_success "스크립트 생성 완료: $script_path"
    
    # 자동으로 PATH에 추가할지 물어보기
    echo
    read -p "이 스크립트를 명령어로 등록하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        add_script "$script_path" "$name"
    else
        log_info "나중에 'add_script $script_path $name' 명령어로 등록할 수 있습니다."
    fi
}

# 스크립트를 PATH에 추가
add_script() {
    local script_path="$1"
    local command_name="${2:-$(basename "$script_path" .sh)}"
    
    if [[ -z "$script_path" ]]; then
        log_error "스크립트 경로를 입력해주세요."
        echo "사용법: add_script <스크립트_경로> [명령어_이름]"
        return 1
    fi
    
    # 절대 경로로 변환
    if [[ ! "$script_path" = /* ]]; then
        script_path="$HOME/.dotfiles/$script_path"
    fi
    
    # 스크립트 존재 확인
    if [[ ! -f "$script_path" ]]; then
        log_error "스크립트를 찾을 수 없습니다: $script_path"
        return 1
    fi
    
    # 실행 권한 확인/설정
    if [[ ! -x "$script_path" ]]; then
        chmod +x "$script_path"
        log_info "실행 권한을 설정했습니다: $script_path"
    fi
    
    # 명령어 이름 유효성 검사
    if [[ ! "$command_name" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        log_error "유효하지 않은 명령어 이름: $command_name"
        echo "명령어 이름은 영문자, 숫자, 하이픈(-), 언더스코어(_)만 사용 가능합니다."
        return 1
    fi
    
    # 기존 명령어와 충돌 확인
    if command -v "$command_name" &>/dev/null && [[ ! -L "$LOCAL_BIN_DIR/$command_name" ]]; then
        log_warning "시스템에 이미 '$command_name' 명령어가 존재합니다."
        read -p "계속 진행하시겠습니까? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "등록을 취소했습니다."
            return 1
        fi
    fi
    
    # 심볼릭 링크 생성
    ln -sf "$script_path" "$LOCAL_BIN_DIR/$command_name"
    
    log_success "'$command_name' 명령어로 사용 가능합니다"
    log_info "원본: $script_path"
    log_info "링크: ~/.bin/$command_name"
    
    # 즉시 사용 가능한지 확인
    if command -v "$command_name" &>/dev/null; then
        log_success "명령어가 즉시 사용 가능합니다: $command_name"
    else
        log_warning "명령어를 사용하려면 새 터미널을 열거나 'hash -r'을 실행하세요."
    fi
}

# 스크립트 제거
remove_script() {
    local command_name="$1"
    
    if [[ -z "$command_name" ]]; then
        log_error "제거할 명령어 이름을 입력해주세요."
        echo "사용법: remove_script <명령어_이름>"
        return 1
    fi
    
    local script_link="$LOCAL_BIN_DIR/$command_name"
    
    if [[ -L "$script_link" ]]; then
        local original_path=$(readlink "$script_link")
        rm "$script_link"
        log_success "'$command_name' 명령어를 제거했습니다"
        log_info "원본 파일은 그대로 유지됩니다: $original_path"
        
        # 해시 테이블 업데이트
        hash -d "$command_name" 2>/dev/null || true
    else
        log_error "'$command_name' 명령어를 찾을 수 없습니다"
        return 1
    fi
}

# 등록된 스크립트 목록 보기
list_scripts() {
    echo -e "${CYAN}등록된 개인 스크립트 목록:${NC}"
    echo "=========================="
    echo -e "${BLUE}방식: ~/.bin (폴더 링크)${NC}"
    echo -e "${BLUE}위치: ~/.bin -> ~/.dotfiles/local/bin${NC}"
    echo
    
    if [[ -d "$LOCAL_BIN_DIR" ]]; then
        local count=0
        for script in "$LOCAL_BIN_DIR"/*; do
            if [[ -L "$script" ]]; then
                local name=$(basename "$script")
                local target=$(readlink "$script")
                local rel_target=${target#$HOME/.dotfiles/}
                
                # 카테고리 추출
                local category="unknown"
                if [[ "$target" == *"/scripts/personal/"* ]]; then
                    category="personal"
                elif [[ "$target" == *"/scripts/work/"* ]]; then
                    category="work"
                elif [[ "$target" == *"/scripts/utils/"* ]]; then
                    category="utils"
                fi
                
                echo -e "📄 ${GREEN}$name${NC} (${YELLOW}$category${NC}) -> $rel_target"
                ((count++))
            fi
        done
        
        if [[ $count -eq 0 ]]; then
            echo "등록된 스크립트가 없습니다."
            echo
            echo "새 스크립트를 만들려면:"
            echo "  create_script <이름> [카테고리]"
            echo
            echo "기존 스크립트를 등록하려면:"
            echo "  add_script <스크립트_경로> [명령어_이름]"
        else
            echo
            echo -e "${GREEN}총 $count개의 스크립트가 등록되어 있습니다.${NC}"
        fi
    else
        echo "스크립트 디렉토리가 설정되지 않았습니다."
        echo "setup_personal_bin 함수를 먼저 실행하세요."
    fi
    echo
}

# 스크립트 편집
edit_script() {
    local command_name="$1"
    
    if [[ -z "$command_name" ]]; then
        log_error "편집할 명령어 이름을 입력해주세요."
        echo "사용법: edit_script <명령어_이름>"
        return 1
    fi
    
    local script_link="$LOCAL_BIN_DIR/$command_name"
    
    if [[ -L "$script_link" ]]; then
        local original_path=$(readlink "$script_link")
        
        # 에디터 선택 (우선순위: $EDITOR, vi, nano)
        local editor="${EDITOR:-vi}"
        if ! command -v "$editor" &>/dev/null; then
            if command -v nano &>/dev/null; then
                editor="nano"
            elif command -v vi &>/dev/null; then
                editor="vi"
            else
                log_error "사용 가능한 에디터를 찾을 수 없습니다."
                return 1
            fi
        fi
        
        log_info "편집 중: $original_path"
        "$editor" "$original_path"
        log_success "편집 완료"
    else
        log_error "'$command_name' 명령어를 찾을 수 없습니다"
        echo "등록된 스크립트 목록을 보려면 'list_scripts'를 실행하세요."
        return 1
    fi
}

# 스크립트 실행 (디버그용)
run_script() {
    local command_name="$1"
    shift
    
    if [[ -z "$command_name" ]]; then
        log_error "실행할 명령어 이름을 입력해주세요."
        echo "사용법: run_script <명령어_이름> [인자들...]"
        return 1
    fi
    
    local script_link="$LOCAL_BIN_DIR/$command_name"
    
    if [[ -L "$script_link" ]]; then
        local original_path=$(readlink "$script_link")
        log_info "실행 중: $original_path"
        echo "----------------------------------------"
        bash "$original_path" "$@"
    else
        log_error "'$command_name' 명령어를 찾을 수 없습니다"
        return 1
    fi
}

# 스크립트 정보 보기
script_info() {
    local command_name="$1"
    
    if [[ -z "$command_name" ]]; then
        log_error "정보를 볼 명령어 이름을 입력해주세요."
        echo "사용법: script_info <명령어_이름>"
        return 1
    fi
    
    local script_link="$LOCAL_BIN_DIR/$command_name"
    
    if [[ -L "$script_link" ]]; then
        local original_path=$(readlink "$script_link")
        
        echo -e "${CYAN}스크립트 정보: $command_name${NC}"
        echo "=========================="
        echo "명령어: $command_name"
        echo "링크: $script_link"
        echo "원본: $original_path"
        echo "크기: $(du -h "$original_path" | cut -f1)"
        echo "수정일: $(stat -c %y "$original_path" 2>/dev/null || stat -f %Sm "$original_path" 2>/dev/null || echo "N/A")"
        echo "권한: $(ls -l "$original_path" | cut -d' ' -f1)"
        echo
        
        # 스크립트 헤더 정보 추출
        echo -e "${CYAN}스크립트 헤더:${NC}"
        head -10 "$original_path" | grep -E "^#" | head -5
        echo
        
        # 도움말 확인
        if "$original_path" --help &>/dev/null || "$original_path" -h &>/dev/null; then
            echo -e "${CYAN}도움말:${NC}"
            "$original_path" --help 2>/dev/null || "$original_path" -h 2>/dev/null || echo "도움말을 사용할 수 없습니다."
        fi
    else
        log_error "'$command_name' 명령어를 찾을 수 없습니다"
        return 1
    fi
}

# 모든 스크립트 관리 함수들의 도움말
script_manager_help() {
    cat << EOF
개인 스크립트 관리 함수들

설정:
    setup_personal_bin          ~/.bin 심볼릭 링크 설정

스크립트 생성/관리:
    create_script <이름> [카테고리]     새 스크립트 생성 (personal/work/utils)
    add_script <경로> [명령어]          기존 스크립트를 명령어로 등록
    remove_script <명령어>              등록된 명령어 제거
    edit_script <명령어>                스크립트 편집

정보 조회:
    list_scripts                        등록된 스크립트 목록
    script_info <명령어>                스크립트 상세 정보
    run_script <명령어> [인자...]       스크립트 실행 (디버그용)

예시:
    create_script "backup_photos" "personal"
    add_script "scripts/utils/system_info.sh" "sysinfo"
    list_scripts
    edit_script "backup_photos"
    remove_script "old_script"

카테고리:
    personal    개인용 스크립트
    work        업무용 스크립트
    utils       유틸리티 스크립트
EOF
}
