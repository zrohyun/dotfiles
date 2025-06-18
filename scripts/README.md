# 개인 스크립트 관리 시스템

이 디렉토리는 개인적으로 자주 사용하는 스크립트들을 체계적으로 관리하고, 명령어로 쉽게 실행할 수 있도록 하는 시스템입니다.

## 📁 디렉토리 구조

```
scripts/
├── personal/           # 개인용 스크립트들
│   └── hello_world.sh  # 샘플: 간단한 인사말 스크립트
├── work/               # 업무용 스크립트들
│   └── project_deploy.sh # 샘플: 프로젝트 배포 스크립트
├── utils/              # 유틸리티 스크립트들
│   └── system_info.sh  # 샘플: 시스템 정보 조회 스크립트
└── migrated/           # 기존 bin/ 디렉토리에서 마이그레이션된 스크립트들
```

## 🔗 심볼릭 링크 구조

```
~/.dotfiles/
├── scripts/            # 실제 스크립트 파일들
├── local/bin/          # 실행 가능한 스크립트들 (심볼릭 링크)
└── config/.path        # PATH 설정

~/
└── .bin/               # ~/.dotfiles/local/bin의 심볼릭 링크
```

## 🚀 사용법

### 기본 설정

dotfiles 설치 시 자동으로 설정되지만, 수동으로 설정하려면:

```bash
# 개인 스크립트 환경 설정
setup_personal_bin

# 스크립트 관리 함수 로드
source ~/.dotfiles/config/functions/script_manager.sh
```

### 새 스크립트 생성

```bash
# 기본 템플릿으로 새 스크립트 생성
create_script "backup_photos" "personal"

# 업무용 스크립트 생성
create_script "deploy_api" "work"

# 유틸리티 스크립트 생성
create_script "cleanup_logs" "utils"
```

### 기존 스크립트 등록

```bash
# 스크립트를 명령어로 등록
add_script "scripts/utils/system_info.sh" "sysinfo"

# 상대 경로도 가능
add_script "scripts/personal/backup_photos.sh" "backup-photos"
```

### 스크립트 관리

```bash
# 등록된 스크립트 목록 보기
list_scripts

# 스크립트 편집
edit_script "backup-photos"

# 스크립트 정보 보기
script_info "sysinfo"

# 스크립트 실행 (디버그용)
run_script "backup-photos" --help

# 스크립트 제거
remove_script "old-script"
```

### 직접 실행

등록된 스크립트는 어디서든 명령어로 실행 가능:

```bash
# 시스템 정보 조회
sysinfo

# 인사말 출력
hello_world "John"

# 프로젝트 배포
project_deploy -e production
```

## 📝 스크립트 템플릿

새 스크립트 생성 시 다음 템플릿이 사용됩니다:

```bash
#!/bin/bash
# Description: 스크립트 설명
# Author: zrohyun
# Created: 2025-01-19
# Category: personal/work/utils

set -euo pipefail

# 메인 함수
main() {
    echo "Hello from 스크립트명 script!"
    # TODO: 스크립트 로직 구현
}

# 도움말 함수
show_help() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS]

스크립트 설명

Options:
    -h, --help    Show this help message

Examples:
    $(basename "$0")        # Run the script
EOF
}

# 인자 처리
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
```

## 🎯 카테고리별 용도

### personal/
- 개인적인 작업 자동화
- 파일 백업 스크립트
- 개인 프로젝트 관리
- 일상 업무 도구

### work/
- 업무 관련 자동화
- 배포 스크립트
- 개발 환경 설정
- 팀 프로젝트 도구

### utils/
- 시스템 유틸리티
- 정보 조회 도구
- 파일 처리 도구
- 네트워크 도구

## 🔧 고급 기능

### 스크립트 편집

```bash
# 기본 에디터로 편집 ($EDITOR 환경변수 사용)
edit_script "script-name"

# 특정 에디터로 편집
EDITOR=nano edit_script "script-name"
```

### 충돌 방지

시스템 명령어와 이름이 겹치는 경우 경고 메시지가 표시되며, 사용자가 선택할 수 있습니다.

### 자동 완성

zsh 사용 시 스크립트 이름 자동 완성이 지원됩니다.

## 📋 관리 명령어 전체 목록

| 명령어 | 설명 |
|--------|------|
| `setup_personal_bin` | ~/.bin 심볼릭 링크 설정 |
| `create_script <이름> [카테고리]` | 새 스크립트 생성 |
| `add_script <경로> [명령어]` | 기존 스크립트를 명령어로 등록 |
| `remove_script <명령어>` | 등록된 명령어 제거 |
| `list_scripts` | 등록된 스크립트 목록 |
| `edit_script <명령어>` | 스크립트 편집 |
| `script_info <명령어>` | 스크립트 상세 정보 |
| `run_script <명령어> [인자...]` | 스크립트 실행 (디버그용) |
| `script_manager_help` | 전체 도움말 |

## 🔍 문제 해결

### PATH에 ~/.bin이 없는 경우

```bash
# 현재 세션에서 임시로 추가
export PATH="$HOME/.bin:$PATH"

# 영구적으로 추가 (이미 config/.path에 설정됨)
echo 'export PATH="$HOME/.bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### 명령어가 인식되지 않는 경우

```bash
# 해시 테이블 새로고침
hash -r

# 또는 새 터미널 세션 시작
```

### 스크립트 실행 권한 문제

```bash
# 실행 권한 확인
ls -la ~/.bin/script-name

# 실행 권한 설정
chmod +x ~/.dotfiles/scripts/category/script.sh
```

## 💡 팁

1. **명명 규칙**: 명령어 이름은 하이픈(-)을 사용하여 가독성을 높이세요
2. **카테고리 활용**: 스크립트를 적절한 카테고리에 분류하여 관리하세요
3. **도움말 작성**: 각 스크립트에 `--help` 옵션을 구현하세요
4. **에러 처리**: `set -euo pipefail`을 사용하여 안전한 스크립트를 작성하세요
5. **로깅**: 중요한 작업은 로그를 남기도록 구현하세요

## 🔄 마이그레이션

기존 `bin/` 디렉토리의 스크립트들은 설치 시 자동으로 `scripts/migrated/`로 이동되고 명령어로 등록됩니다.

---

더 자세한 정보는 `script_manager_help` 명령어를 실행하거나 각 스크립트의 `--help` 옵션을 확인하세요.
