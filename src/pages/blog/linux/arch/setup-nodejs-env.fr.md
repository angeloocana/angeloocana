---
title: Setup dev env Arch linux
date: '2017-07-30'
layout: post
draft: false
---

## Install git
```bash
    sudo pacman -S git
```

## Install Nodejs
```bash
    sudo pacman -S nodejs
```

## Install NPM
```bash
    sudo pacman -S npm
```

### Fix global permissions error
https://docs.npmjs.com/getting-started/fixing-npm-permissions

Make a directory for global installations:
```bash
    mkdir ~/.npm-global
```

Configure npm to use the new directory path:
```bash
    npm config set prefix '~/.npm-global'
```

Open or create a ~/.profile file and add this line:
```bash
    export PATH=~/.npm-global/bin:$PATH
```

Back on the command line, update your system variables:
```bash
    source ~/.profile
```

## Install vs code
```bash
    yaourt -S visual-studio-code
```

## Install Python for Gatsby
```bash
    sudo pacman -S python2
```
