---
title: Manjaro Linux ajuda com comandos
date: '2017-06-23'
layout: post
path: "pt/blog/linux/manjaro/help-commands"
---

# Instalar Manjaro

## Mudar layout do teclado para abnt2
```
    sudo setxkbmap -model abnt2 -layout br -variant abnt2
```

## MongoDB

### Instalar MongoDB
```
    sudo pacman -S mongodb
```

### Iniciar MongoDB
```
    systemctl start mongodb.service
```
