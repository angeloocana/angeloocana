---
title: How to install Yaourt on Arch linux
date: '2017-08-26'
layout: post
draft: false
tags:
  - Linux
  - Arch
structuredData:
  type: TechArticle
  locationCreated: Ottawa CA
  dependencies: Arch Linux
  proficiencyLevel: Beginner
  articleSection: Arch Linux
  pageEnd:
  pageStart:
  pagination:
  about:
    name: Arch Linux
    alternateName: Arch
    description: lightweight and flexible Linux® distribution that tries to Keep It Simple.
    identifier: arch-linux
    image:
    sameAs: https://www.archlinux.org/
  accessMode: textual
  accessModeSufficient: textual
  accessibilityAPI: ARIA
  accessibilityControl: fullKeyboardControl, fullTouchControl, fullMouseControl
  accessibilitySummary:
  aggregateRating: ...
  audience: ...
  author: angeloocana
  comment: ...
  commentCount: ...
  contentLocation: ...
  dateCreated: '2017-08-26'
  dateModified: '2017-08-30'
  datePublished: '2017-08-30'
  discussionUrl: ...
  educationalUse: ...
  isAccessibleForFree: true
  isFamilyFriendly: true
  keywords: ...  
  thumbnailUrl: ...
  version: 1
  video: ...
---

Yaourt is the community packager manager for Arch Linux.

When you are using **pacman** (official packager manager), you do need to use **sudo**,
when you are using **yaourt**, you don't.

Open the file below for editing:
```bash
    sudo vim /etc/pacman.conf
```
Add it to the bottom:
```conf
    [archlinuxfr]
    SigLevel = Never
    Server = http://repo.archlinux.fr/$arch
```

Install yaourt
```bash
    sudo pacman -Sy yaourt
```
