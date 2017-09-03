---
title: Fix ENOSPC error
date: '2017-09-03'
layout: post
draft: false
tags:
    - Linux
    - Arch
readNext:
    - /en/blog/linux/arch/install-arch-linux-wifi-xfce4/
    - /en/blog/linux/arch/install-libre-office/
    - /en/blog/linux/arch/extract-files/
structuredData:
  dateCreated: '2017-09-03'
  dateModified: '2017-09-03'
  datePublished: '2017-09-03'
  alternativeHeadline: Fix ENOSPC error for Arch linux
  locationCreated: Ottawa CA
  type: TechArticle
  dependencies: Linux
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
  discussionUrl: ...
  educationalUse: ...
  isAccessibleForFree: true
  isFamilyFriendly: true
  keywords: ...  
  thumbnailUrl: ...
  version: 1
  video: ...
---

This error happens when your are watching to many files on linux.

You can get an error message like this:

> error UNHANDLED EXCEPTION
> 
> Error: watch /home/angeloocana/dev/angeloocana/node_modules/browser-resolve/no  de_modules/resolve/test/subdirs/node_modules/a/b **ENOSPC**


## Fix ENOSPC error

Just run this command on a terminal and be Happy! =D

```bash
    echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```
