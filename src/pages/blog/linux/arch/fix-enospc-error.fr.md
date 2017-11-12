---
title: Correction de l'erreur ENOSPC
date: '2017-09-03'
layout: post
draft: false
tags:
    - Linux
    - Arch
readNext:
    - /fr/blog/linux/arch/install-arch-linux-wifi-xfce4/
    - /fr/blog/linux/arch/install-libre-office/
    - /fr/blog/linux/arch/extract-files/
structuredData:
  dateCreated: '2017-09-03'
  dateModified: '2017-09-03'
  datePublished: '2017-09-03'
  alternativeHeadline: Correction de l'erreur ENOSPC pour Arch linux
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

Cette erreur se produit lorsque vous regardez de nombreux fichiers dans linux.

Vous pouvez recevoir un message d'erreur comme ceci:

> error UNHANDLED EXCEPTION
> 
> Error: watch /home/angeloocana/dev/angeloocana/node_modules/browser-resolve/no  de_modules/resolve/test/subdirs/node_modules/a/b **ENOSPC**


## Correction

Exécutez cette commande sur un terminal et soyez heureux! = D

```bash
    echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```
