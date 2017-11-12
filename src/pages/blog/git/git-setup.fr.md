---
title: Git help commands
date: '2017-06-23'
layout: post
draft: false
tags:
  - Git
  - contrôle de version
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

Enable Auto Complete, Commit with title and description, create alias, navigate history, update fork and more!

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

## Sync Forked repository

Add the remote, call it "upstream":
```bash
    git remote add upstream https://github.com/whoever/whatever.git
```

Fetch all the branches of that remote into remote-tracking branches,
such as upstream/master:

```bash
    git fetch upstream
```

Make sure that you're on your master branch:

```bash
    git checkout master
```

Rewrite your master branch so that any commits of yours that
aren't already in upstream/master are replayed on top of that
other branch:

```bash
    git rebase upstream/master
```
