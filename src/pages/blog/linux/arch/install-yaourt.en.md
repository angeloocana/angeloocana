---
title: How to install Yaourt on Arch linux
date: '2017-08-26'
layout: post
draft: false
tags:
  - Linux
  - Arch
---

Yaourt contains the community packages for Arch Linux.

For pacman always use sudo, for yaourt never!!!

Open the file below for editing:
```bash
    sudo vim /etc/pacman.conf
```
Add to the bottom:
```conf
    [archlinuxfr]
    SigLevel = Never
    Server = http://repo.archlinux.fr/$arch
```

Install yaourt
```bash
    sudo pacman -Sy yaourt
```
