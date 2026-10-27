---
title: Git comandos Avançados
date: '2017-06-23'
layout: post
draft: false
tags:
  - Git
  - controle de versões
structuredData:
  alternativeHeadline: ...  
  locationCreated: Ottawa CA
  type: TechArticle  
  dependencies: A computer
  proficiencyLevel: Beginner
  articleSection: Git
  pageEnd: ...
  pageStart: ...
  pagination: ...
  about:
    name: Git
    alternateName: Github
    description: Git is a free and open source distributed version control system designed to handle everything from small to very large projects with speed and efficiency.
    identifier: git
    image: ...
    sameAs: https://git-scm.com/
  accessMode: textual
  accessModeSufficient: textual
  accessibilityAPI: ARIA
  accessibilityControl: fullKeyboardControl, fullTouchControl, fullMouseControl
  accessibilitySummary: ...
  aggregateRating: ...
  audience: ...
  author: angeloocana
  comment: ...
  commentCount: ...
  contentLocation: ...
  dateCreated: ...
  dateModified: ...
  datePublished: ...
  discussionUrl: ...
  educationalUse: ...
  isAccessibleForFree: true
  isFamilyFriendly: true
  keywords: ...
  thumbnailUrl: ...
  version: 1
  video: ...
---

Habilite auto complete, Commit com titulo e descrição, navege pelo histórico, atualize fork e muito mais!

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
