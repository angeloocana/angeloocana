---
title: Corrigir erro ENOSPC
date: '2017-09-03'
layout: post
draft: false
tags:
    - Linux
    - Arch
readNext:
    - /pt/blog/linux/arch/install-arch-linux-wifi-xfce4/
    - /pt/blog/linux/arch/install-libre-office/
    - /pt/blog/linux/arch/extract-files/
structuredData:
  dateCreated: '2017-09-03'
  dateModified: '2017-09-03'
  datePublished: '2017-09-03'
  alternativeHeadline: ENOSPC arrumar erro no arch linux
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

Esse erro acontece quando você esta assistindo muitos arquivos no linux.

Você pode receber uma mensagem erro como essa:

> error UNHANDLED EXCEPTION
> 
> Error: watch /home/angeloocana/dev/angeloocana/node_modules/browser-resolve/no  de_modules/resolve/test/subdirs/node_modules/a/b **ENOSPC**


## Arrumar ENOSPC

Apenas execute o comando abaixo no console do linux e seja Feliz! =D

```bash
    echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```
