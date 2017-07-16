---
title: Manjaro Linux help commands
date: '2017-06-23'
layout: post
path: "en/blog/linux/manjaro/help-commands"
---

# Manjaro Install

## Fix keyboard layout to abnt2
```
    sudo setxkbmap -model abnt2 -layout br -variant abnt2
```

## MongoDB

### Install MongoDB
```
    sudo pacman -S mongodb
```

### Start MongoDB
```
    systemctl start mongodb.service
```