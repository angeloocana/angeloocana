---
title: Vim Help Commands
date: '2017-08-08'
layout: post
draft: false
tags:
  - Text Editor
---

Vim is a old school text editor, It runs in the console, It is the faster of all.
It's the best option for accessing servers through line command.

## Basic commands

`Y` Copy line.

`v` Select lines pressing arrows.

`y` Copy lines.

`d` Cut lines.

`P` Paste before current line.

`p` Paste.

`/<span>textToSearch</span>` Search.

`n` Go to the next match.

`N` Go to previous match.

`r<span>L</span>` Replace next character with 'L'.

`:%s/<span>search</span>/<span>replace</span>/gc` Search and Replace.

`:w` Write changes (Save).

`:q` Quit.

`i` insert text mode.

`o` create a new line and enable insert text mode.

`:set hlsearch` high light text search.

`:set incsearch` It enables searching while typing.

`<span>12</span>G` Go to line 12.

`gg` Go to the top of the file.

`G` Go to the end of the file.

`:cd <span>path</span>` Change the working directory. Files can now be opened with relative paths. Use TAB and arrows to autocomplete directory names.

`:pwd` Shows the working directory.

`:e .` List working directory files and folders.

`:e <span>file-name` Opens the file.

`dd` Delete line.

`u` Revert changes.

`v` Select text.

`V` Select Lines.

`d` Delete selected text.

`c` Delete selected text and go into Insert mode.

`:b <span>file-name</span>` Switch to buffer (try TAB and arrows as well).

`:bp` Previous buffer.

`h` Move one character to the left.

`l` Move one character to the right.

`j` Move one line upward.

`k` Move one line down.

## Windows

`ctrl-w s` Split window horizontally.

`ctrl-w v` Split vertically.

`ctrl-w j` Move focus down.

`ctrl-w k` Move focus up.

`ctrl-w j` Move buffer up one window.

`ctrl-w k` Move buffer down one window.

`ctrl-w c` Close window.

`ctrl-w o` Close all but current.

`ctrl-w w` Cycle focus.

`ctrl-w p` Focus previous window.

## Indent

`gg=G` Indent entire file.

`Vjj>` Indent mutiple lines.

## Line number

`:set number` Show line numbers.

`:highlight LineNr ctermfg=grey` Change line numbers color.

`:set cursorline` Show current line.

## Plugins

### Typescript Syntax for Vim

<a target='_blank' href='https://github.com/leafgarland/typescript-vim'>https://github.com/leafgarland/typescript-vim</a>

```bash
    git clone https://github.com/leafgarland/typescript-vim.git ~/.vim/bundle/typescript-vim
```

### Tsuquyomi: Make your Vim a TypeScript IDE.

<a target='_blank' href='https://github.com/Quramy/tsuquyomi'>https://github.com/Quramy/tsuquyomi</a>

```bash
    # Install and compile procvim.vim
    git clone https://github.com/Shougo/vimproc.vim.git ~/.vim/bundle/vimproc.vim
    
    cd ~/.vim/bundle/vimproc.vim
    
    make

    popd

    # Install tsuquyomi
    git clone https://github.com/Quramy/tsuquyomi.git ~/.vim/bundle/tsuquyomi
```
