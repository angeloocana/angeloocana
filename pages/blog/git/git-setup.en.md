---
title: Git help commands
date: '2017-06-23'
layout: post
path: "en/blog/git/help-commands/"
---

# Setup Git

## Enable Auto Complete while typing git commands on terminal

```bash
    wget https://github.com/git/git/blob/master/contrib/completion/git-completion.bash --quiet --show-progress -O ~/git-completion.bash
```

```bash
    echo -e "\nsource ~/git-completion.bash" >> ~/.bash_profile
```

## Commit with title and full description
Set vim as default editor:
```bash
    export EDITOR='vim'
```

Open vim to edit commit message:
```bash
    git commit -a
```
first line is the title
third line is the full description


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
