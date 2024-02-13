set nocompatible " be iMproved
filetype off

set rtp+=~/.vim/bundle/Vundle.vim/Vundle.vim
call vundle#begin()
" let Vundle manage Vundle
" rquired!-
" My Bundles here:
Plugin 'VundleVim/Vundle.vim'
" alternatively, pass a eepath where Vundle should install plugins
" call vundle#begin('~/some/path/here')
"call vundle#begin()

" let Vundle manage Vundle, required "        Plugin 'VundleVim/Vundle.vim'
"Plugin 'preservim/nerdtree'
"Plugin 'mg979/vim-visual-multi', {'branch': 'master'}

" The following are examples of different formats supported.
" Keep Plugin commands between vundle#begin/end.
" plugin on GitHub repo
" Plugin 'tpope/vim-fugitive'
" plugin from http://vim-scripts.org/vim/scripts.html
" Plugin 'L9'
" Git plugin not hosted on GitHub
" Plugin 'git://git.wincent.com/command-t.git'
" git repos on your local machine (i.e. when working on your own plugin)
" Plugin 'file:///home/gmarik/path/to/plugin'
" The sparkup vim script is in a subdirectory of this repo called vim.
" Pass the path to set the runtimepath properly.
" Plugin 'rstacruz/sparkup', {'rtp': 'vim/'}
" Install L9 and avoid a Naming conflict if you've already installed a
" different version somewhere else.
" Plugin 'ascenator/L9', {'name': 'newL9'}

" All of your Plugins must be added before the following line
"
call vundle#end()

filetype plugin indent on  " required!
" 
" Brief help
" :BundleList       - list configured bundles
" :BundleInstall(!) - install(update) bundles
" :BundleSearch(!) foo - search(or refresh cache first) for foo
" :BundleClean(!)  - confirm(or auto-appprove) removal of unused bundles
"
" ColorSchemes
" let g:solarized_termcolors=256
"
set background=dark
" colorscheme desert

set ruler
set spell
set expandtab

function RandomColorScheme()
        let mycolors = split(globpath(&rtp,"**/colors/*.vim"),"\n") 
        exe 'so ' . mycolors[localtime() % len(mycolors)]
        unlet mycolors
endfunction

"call RandomColorScheme()

" :command NewColor call RandomColorScheme()

set number
if has("syntax")
        syntax on
        colorscheme delek
endif

"filetype python indect on
autocmd FileType python set softtabstop=4
autocmd FileType python set tabstop=4
autocmd FileType python set autoindent

" yank to os clipboard
set clipboard=unnamedplus
"`set relnumber

" map ;; to ESC key mapping  
map ii <ESC> 
imap ii <ESC>
" nmap j gj
" nmap k gk

" Swap H and ^ keys
nnoremap H ^
nnoremap ^ H
vnoremap H ^
vnoremap ^ H


" Swap L and $ keys
nnoremap L $
nnoremap $ L
vnoremap L $
vnoremap $ L


" inoremap jj <ESC>
" vnoremap jj <ESC>

nnoremap <C-w><C-q> ZZ
"nnoremap <silent> <leader>v :rightbelow vsp \| e %:p:h/<C-r><C-f><CR>
cnoreabbrev vsf rightbelow vsp
