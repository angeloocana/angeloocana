---
title: Comment installer Yaourt sur Arch Linux
date: '2017-08-30'
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

Yaourt est le gestionnaire de paquets de communauté pour Arch Linux.

Lorsque vous utilisez **pacman** (gestionnaire de paquetage officiel), vous devez utiliser **sudo**,
pour le **yaourt** vous n'avez pas à le faire.

Ouvrez le fichier ci-dessous pour l'édition:
```bash
    sudo vim /etc/pacman.conf
```

Ajoutez ceci à la fin du fichier:
```conf
    [archlinuxfr]
    SigLevel = Never
    Server = http://repo.archlinux.fr/$arch
```

Installer yaourt
```bash
    sudo pacman -Sy yaourt
```
