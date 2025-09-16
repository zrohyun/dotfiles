#             _              
#            | |             
#     _______| |__  _ __ ___ 
#    |_  / __| '_ \| '__/ __|
#   _ / /\__ \ | | | | | (__ 
#  (_)___|___/_| |_|_|  \___|

# Enable Powerlevel10k instant prompt. Should stay close to the top of ~/.zshrc.
# Initialization code that may require console input (password prompts, [y/n]
# confirmations, etc.) must go above this block; everything else may go below.
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
    source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

# If you come from bash you might have to change your $PATH.
# export PATH=$HOME/bin:/usr/local/bin:$PATH

# Path to your oh-my-zsh installation.
export ZSH="${XDG_CONFIG_HOME:-$HOME}/.oh-my-zsh"

# Set name of the theme to load --- if set to "random", it will
# load a random theme each time oh-my-zsh is loaded, in which case,
# to know which specific one was loaded, run: echo $RANDOM_THEME
# See https://github.com/ohmyzsh/ohmyzsh/wiki/Themes
# ZSH_THEME="robbyrussell"
ZSH_THEME="powerlevel10k/powerlevel10k"

export POWERLEVEL9K_CONFIG_FILE="${ZSH_CONFIG_DIR:-$HOME}/.p10k.zsh"
export ZDOTDIR=$ZSH_CONFIG_DIR # zsh config dir
export HISTFILE=${ZSH_STATE_DIR}/.zsh_history
export ZSH_COMPDUMP=$ZSH_CACHE_DIR/.zcompdump-$HOST
# https://github.com/agkozak/zsh-z
export ZSHZ_DATA=${ZSH_CACHE_DIR:-$HOME}/.z
# To customize prompt, run `p10k configure` or edit ~/.config/zsh/.p10k.zsh.
[[ ! -f ~/.config/zsh/.p10k.zsh ]] || source ~/.config/zsh/.p10k.zsh

# 메모리와 파일 모두 200k로 확장
HISTSIZE=200000
SAVEHIST=500000

# 추가 옵션
setopt APPEND_HISTORY         # 세션 종료 시 히스토리를 append
setopt INC_APPEND_HISTORY     # 명령 실행 시 바로 기록
setopt SHARE_HISTORY          # 여러 세션 간 실시간 공유
setopt HIST_IGNORE_DUPS       # 연속 중복 제거
# setopt HIST_IGNORE_SPACE      # 공백으로 시작한 명령은 저장 안 함
setopt HIST_REDUCE_BLANKS     # 불필요한 공백 제거


# Set list of themes to pick from when loading at random
# Setting this variable when ZSH_THEME=random will cause zsh to load
# a theme from this variable instead of looking in $ZSH/themes/
# If set to an empty array, this variable will have no effect.
# ZSH_THEME_RANDOM_CANDIDATES=( "robbyrussell" "agnoster" )

# Uncomment the following line to use case-sensitive completion.
# CASE_SENSITIVE="true"

# Uncomment the following line to use hyphen-insensitive completion.
# Case-sensitive completion must be off. _ and - will be interchangeable.
# HYPHEN_INSENSITIVE="true"

# Uncomment one of the following lines to change the auto-update behavior
# zstyle ':omz:update' mode disabled  # disable automatic updates
zstyle ':omz:update' mode auto      # update automatically without asking
# zstyle ':omz:update' mode reminder  # just remind me to update when it's time

# Uncomment the following line to change how often to auto-update (in days).
# zstyle ':omz:update' frequency 13

# Uncomment the following line if pasting URLs and other text is messed up.
# DISABLE_MAGIC_FUNCTIONS="true"

# Uncomment the following line to disable colors in ls.
# DISABLE_LS_COLORS="true"

# Uncomment the following line to disable auto-setting terminal title.
# DISABLE_AUTO_TITLE="true"

# Uncomment the following line to enable command auto-correction.
# ENABLE_CORRECTION="true"

# Uncomment the following line to display red dots whilst waiting for completion.
# You can also set it to another string to have that shown instead of the default red dots.
# e.g. COMPLETION_WAITING_DOTS="%F{yellow}waiting...%f"
# Caution: this setting can cause issues with multiline prompts in zsh < 5.7.1 (see #5765)
# COMPLETION_WAITING_DOTS="true"

# Uncomment the following line if you want to disable marking untracked files
# under VCS as dirty. This makes repository status check for large repositories
# much, much faster.
# DISABLE_UNTRACKED_FILES_DIRTY="true"

# Uncomment the following line if you want to change the command execution time
# stamp shown in the history command output.
# You can set one of the optional three formats:
# "mm/dd/yyyy"|"dd.mm.yyyy"|"yyyy-mm-dd"
# or set a custom format using the strftime function format specifications,
# see 'man strftime' for details.
# HIST_STAMPS="mm/dd/yyyy"

# Would you like to use another custom folder than $ZSH/custom?
# ZSH_CUSTOM=/path/to/new-custom-folder

# Which plugins would you like to load?
# Standard plugins can be found in $ZSH/plugins/
# Custom plugins may be added to $ZSH_CUSTOM/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
# Add wisely, as too many plugins slow down shell startup.
plugins=(
    # https://velog.io/@jyha81/oh-my-zsh-plugin-%EC%97%90%EB%9F%AC-%EB%8C%80%EC%9D%91
    # https://github.com/ohmyzsh/ohmyzsh/wiki/Plugins
    git
    zsh-syntax-highlighting
    zsh-autosuggestions
    aliases
    brew
    macos
    z
    asdf
    # ripgrep
    colorize 
    docker 
    kubectl
    kn
    docker-compose
    ubuntu
    command-not-found
    gh
    # common-aliases # command not found: pygmentize 에러 발생 
    # autoenv
    # dotenv
    # direnv
    # composer 
    # fasd
    # fzf # linux fzf 에러발생중 임시 주석 #fzf_setup_using_debian:source:40: no such file or directory: /usr/share/doc/fzf/examples/key-bindings.zsh
    # TODO: tmux-plugin?, oh-my-tmux?
    # tmux #! plugin 에러 발생  
)

if command -v fzf &>/dev/null; then
    plugins+=(fzf)
# else
    # echo "fzf command not found. Skipping fzf plugin."
fi

source $ZSH/oh-my-zsh.sh

# User configuration

# export MANPATH="/usr/local/man:$MANPATH"

# You may need to manually set your language environment
# export LANG=en_US.UTF-8

# Preferred editor for local and remote sessions
# if [[ -n $SSH_CONNECTION ]]; then
#   export EDITOR='vim'
# else
#   export EDITOR='mvim'
# fi

# Compilation flags
# export ARCHFLAGS="-arch x86_64"

# Set personal aliases, overriding those provided by oh-my-zsh libs,
# plugins, and themes. Aliases can be placed here, though oh-my-zsh
# users are encouraged to define aliases within the ZSH_CUSTOM folder.
# For a full list of active aliases, run `alias`.
#
# Example aliases
# alias zshconfig="mate ~/.zshrc"
# alias ohmyzsh="mate ~/.oh-my-zsh"

# To customize prompt, run `p10k configure` or edit ~/.p10k.zsh.


# KUBECTL
# source <(kubectl completion zsh)

# if [[ $machine == "Mac" ]]; then
#   eval "$(zoxide init zsh)"
#   brew_update
# fi

#nvm
# export NVM_DIR="$HOME/.nvm"
[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"  # This loads nvm
[ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"  # This loads nvm bash_completion

# zsh users - add the following line to your ~/.zshrc
# eval "$(direnv hook zsh)"

# load custom aliases(alias overwrite)
load_aliases

# load local configuration (tracked via examples, actual files ignored)
if [[ -f "$HOME/.dotlocal/.local.env" ]]; then
    source "$HOME/.dotlocal/.local.env"
fi

if [[ -f "$HOME/.dotlocal/.local.sh" ]]; then
    source "$HOME/.dotlocal/.local.sh"
fi
