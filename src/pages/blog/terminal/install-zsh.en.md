---
title: Install ZSH and oh-my-zsh
date: '2017-06-23'
layout: post
path: "en/blog/terminal/install-zsh/"
---

# Install ZSH and oh-my-zsh

## Install ZSH
https://github.com/robbyrussell/oh-my-zsh/wiki/Installing-ZSH

## Install oh-my-zsh
Download
```bash
    wget https://raw.github.com/robbyrussell/oh-my-zsh/master/tools/install.sh --quiet --show-progress -O ~/install.sh
```

Install
```bash
    sh ~/install.sh
```

Make it your default shell: (You must logout to see the changes)
```bash
    sudo chsh -s $(which zsh)
```
