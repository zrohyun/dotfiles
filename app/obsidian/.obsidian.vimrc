
" set tapstop=4

nmap j gj
nmap k gk
imap jj <Esc>

" Swap H and ^ keys
""nmap H ^
""nmap L $
noremap H ^
noremap ^ H
noremap L $
noremap $ L
" "nmap ^ H
"
" "" " Swap L and $ keys
" "nnoremap L $
" "nnoremap $ L
" "vnoremap L $
" "vnoremap $ L

" map ;; to ESC key mapping 
""noremap ii <ESC>
""nmap ii <ESC>
" nnoremap ;; <ESC>
" inoremap ;; <ESC>
" vnoremap ;; <ESC>

" nmap H ^
" nmap L $

" yank to os clipboard
set clipboard=unnamedplus

exmap back obcommand app:go-back
nmap <C-o> back

exmap surround_wiki surround [[ ]]
exmap surround_double_quotes surround " "
exmap surround_single_quotes surround ' '
exmap surround_brackets surround ( )
exmap surround_square_brackets surround [ ]
exmap surround_curly_brackets surround { }
exmap surround_backtick surround ` `

" NOTE: must use 'map' and not 'nmap'
map [[ :surround_wiki
nunmap s
vunmap s
map s" :surround_double_quotes
map s' :surround_single_quotes
map sb :surround_brackets
map s( :surround_brackets
map s) :surround_brackets
map s[ :surround_square_brackets
map s] :surround_square_brackets
map s{ :surround_curly_brackets
map s} :surround_curly_bracket
map s` :surround_backtick

" Emulate Folding https://vimhelp.org/fold.txt.html#fold-commands
exmap togglefold obcommand editor:toggle-fold
nmap zo :togglefold
nmap zc :togglefold
nmap za :togglefold

exmap unfoldall obcommand editor:unfold-all
nmap zR :unfoldall

exmap foldall obcommand editor:fold-all
nmap zM :foldall

" Emulate Tab Switching https://vimhelp.org/tabpage.txt.html#gt
" requires Cycle Through Panes Plugins https://obsidian.md/plugins?id=cycle-through-panes
exmap tabnext obcommand cycle-through-panes:cycle-through-panes
nmap gt :tabnext
exmap tabprev obcommand cycle-through-panes:cycle-through-panes-reverse
nmap gT :tabprev
