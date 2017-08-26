---
title: Access and Backup Android Files and Photos
date: '2017-08-26'
layout: post
draft: false
tags:
  - Linux
  - Arch
  - Android
structuredData:
  type: TechArticle
  dependencies: Arch Linux and Android Mobile Phone
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
  accountablePerson:
    additionalName: angeloocana
---

Is your Android mobile FULL? Backup your data to your Arch Linux.
It is easy following my steps (I hope hahaha).
I had some trouble with some programs, so here it goes what works for me:


## Install simple-mtpfs
If you do not have or know what is **Yaourt**, please check it out:
https://angeloocana.com/en/blog/linux/arch/install-yaourt/

```bash
    yaourt -S simple-mtpfs
```

## Create destination folder
I'll be using **mnt** folder, you can use any name, but remember it for the next step.
```bash
    mkdir ~/mnt
```

## Mount your Phone to a folder
```bash
    simple-mtpfs --device 1 ~/mnt
```

That is it! uhuhuh
Just go to **~/mnt**, your files will be there!


Official guide: https://wiki.archlinux.org/index.php/MTP
