#!/bin/bash

if command -v brew &>/dev/null; then
  eval "$($(which brew) shellenv)"
else
  eval "$(/opt/homebrew/bin/brew shellenv)"
fi