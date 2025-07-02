# Node.js 백업 스크립트

이 디렉토리에는 복잡한 Node.js 패키지 설치 스크립트들이 백업되어 있습니다.

## 파일 설명

### install_node_packages.sh
- npm 글로벌 패키지 자동 설치
- npx 명령어 실행
- 복잡한 Node.js 생태계 설정

## 포함된 패키지들

### npm 글로벌 패키지
- @anthropic-ai/claude-code
- typescript
- ts-node
- nodemon
- pm2
- http-server
- live-server
- prettier
- eslint
- @vue/cli
- create-react-app
- vite
- yarn
- pnpm

### npx 명령어
- https://github.com/google-gemini/gemini-cli

## 사용법

필요시 다음과 같이 실행할 수 있습니다:

```bash
# 백업된 스크립트 실행
cd /path/to/dotfiles
source scripts/bak/install_node_packages.sh
install_node_ecosystem
```

## 참고

기본 설치 스크립트에서는 Node.js, npm, nvm만 설치하며, 
추가 패키지가 필요한 경우 이 백업 스크립트를 사용하세요.
