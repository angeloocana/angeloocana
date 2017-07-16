---
title: Ajuda com comandos Git
date: '2017-06-23'
layout: post
path: "pt/blog/git/help-commands/"
---

# Ajuda com comandos Git

## Habilitar auto complete ao digitar commandos git no terminal

```bash
    wget https://github.com/git/git/blob/master/contrib/completion/git-completion.bash --quiet --show-progress -O ~/git-completion.bash
```

```bash
    echo -e "\nsource ~/git-completion.bash" >> ~/.bash_profile
```

## Criar commit com titulo e descrição completa
**Opcional** Habilitar vim como editor padrão:
    Eu amo o VIM, mas sei que é bem dificil para iniciantes.
    Se você quer subir para outro nivel como programador, aconselho aprender o editor mais poderoso que conheço.
```bash
    export EDITOR='vim'
```

Abrir editor para preencher titulo e descrição do commit:
```bash
    git commit -a
```
Primeira linha é o titulo
Terceira linha em diante é a descrição.


## Git Alias
to use 'git st'
```bash
    git config --global alias.st status
```

All alias
```bash
    cat .git/config | grep -A 1 "\[alias\]"
```

## Log
https://git-scm.com/docs/pretty-formats
```bash
    git log --pretty='%Cred%h%Creset | %C(yellow)%d%Creset %s %Cgreen(%cr)%Creset %C(cyan)[%an]%Creset' --graph --all
```
Alias log
```bash
    git config --global alias.lg "log --pretty='%Cred%h%Creset | %C(yellow)%d%Creset %s %Cgreen(%cr)%Creset %C(cyan)[%an]%Creset' --graph --all"
```

## Diff
Words
```bash
    git config --global alias.dp 'diff --word-diff --unified=10'
```

Blocks
```bash
    git diff --patience
```

histogram
```bash
    git diff histogram
```

## Verifying commits

```bash
    git config --global core.whitespace "blank-at-eol,blank-at-eof,tab-in-indent"
```

## Documenting Commits
```bash
    wget http://git.io/validate-commit-msg --show-progress --quiet -O .git/hooks/commit-msg
```
```bash
    chmod a+x .git/hooks/commit-msg
```

## Edit commit not pushed
```bash
    git commit --amend
```
