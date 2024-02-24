" Vim을 개선된 상태로 설정
set nocompatible

" 파일 유형 감지 끄기
filetype off
nnoremap <C-c>p :normal! viw"0p<CR> " 0번째 reg로 단어 대치
" Syntax Highlighting 활성화
if has("syntax")
     syntax on
endif

" 여러 에디팅 환경 설정
set ruler            " 화면 상단에 커서 위치 정보 표시
set spell            " 스펠링 검사 활성화
set paste
set expandtab        " 탭 대신 스페이스 사용
set mouse=a
set go+=a
" set number           " 줄 번호 표시
set autoindent       " 자동 들여쓰기
set ts=4             " 탭 너비
set shiftwidth=4     " 자동 인덴트할 때 너비
set clipboard+=unnamed " 클립보드 사용

" 상태 표시 줄 설정
set laststatus=2     " 상태 바 항상 표시
set statusline=\ %<%l:%v\ [%P]%=%a\ %h%m%r\ %F\

" Python 파일 관련 설정
autocmd FileType python set softtabstop=4
autocmd FileType python set tabstop=4
autocmd FileType python set autoindent

" 자주 쓰는 명령어 단축어 
nnoremap <C-c>p :normal! viw"0p<CR> " 0번째 register로 단어 대치
nnoremap <C-c>( :normal! ciw( <Esc>pa )<Esc>
nnoremap <C-c>" :normal! ciw"<Esc>pa"<Esc>
nnoremap <C-c>' :normal! ciw"<Esc>pa'<Esc>
nnoremap <C-c>y :normal! viwy<Esc>

" H 키와 ^ 키를 바꿈
nnoremap H ^
nnoremap ^ H
" L 키와 $ 키를 바꿈
nnoremap L $
nnoremap $ L

" 키 매핑 및 단축키 변경
" ii를 누르면 Normal 모드로 돌아감
" map ii <ESC>
" Insert 모드에서도 ii를 누르면 Normal 모드로 돌아감
imap ii <ESC> 

" nnoremap <C-w><C-q> ZZ " <C-w><C-q>를 누르면 현재 창을 닫음

" 기타 설정
set hlsearch        " 검색어 하이라이팅 활성화
set numberwidth=4    " 줄 번호 표시 공간의 가로 길이 설정
set scrolloff=2     " 스크롤 시 커서 주변에 몇 줄을 보여줄지 설정
set wildmenu        " 명령어 완성을 위한 설정
set wildmode=longest,list
set relativenumber

set history=256     " 히스토리 기억 개수 설정
