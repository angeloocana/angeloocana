---
title: Como instalar Yaourt no Arch Linux
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

Yaourt é o gerenciador de pacotes da comunidade para o Arch Linux.

Quando você usa o **pacman** (gerenciador de pacotes oficial) você precisa usar **sudo**,
para o **yaourt** você não precisa.

Abra o arquivo abaixo para edição:
```bash
    sudo vim /etc/pacman.conf
```

Adicione isto no final do arquivo:
```conf
    [archlinuxfr]
    SigLevel = Never
    Server = http://repo.archlinux.fr/$arch
```

Instalar yaourt
```bash
    sudo pacman -Sy yaourt
```
