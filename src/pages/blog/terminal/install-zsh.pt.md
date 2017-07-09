---
title: Instalar ZSH e oh-my-zsh
date: '2017-06-23'
layout: post
path: "pt/blog/terminal/install-zsh/"
---

# Instalar ZSH e oh-my-zsh

## Instalar ZSH
https://github.com/robbyrussell/oh-my-zsh/wiki/Installing-ZSH

## Instalar oh-my-zsh
Baixar
```bash
    wget https://raw.github.com/robbyrussell/oh-my-zsh/master/tools/install.sh --quiet --show-progress -O ~/install.sh
```

Instalar
```bash
    sh ~/install.sh
```

Transformar zsh em terminal padrão. (Você precisa deslogar para ver a mudança)
```bash
    sudo chsh -s $(which zsh)
```
