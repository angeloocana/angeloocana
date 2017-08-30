---
title: Comment enregistrer des photos depuis votre téléphone vers Arch Linux
date: '2017-08-30'
layout: post
draft: false
tags:
  - Linux
  - Arch
  - Android
structuredData:
  alternativeHeadline: ...
  locationCreated: Ottawa CA
  type: TechArticle
  dependencies: Arch Linux et téléphone Android
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
  dateModified: '2017-08-28'
  datePublished: '2017-08-28'
  discussionUrl: ...
  educationalUse: ...
  isAccessibleForFree: true
  isFamilyFriendly: true
  keywords: ...  
  thumbnailUrl: ...
  version: 1
  video: ...
---

Votre téléphone est-il plein? Sauvegardez vos fichiers Arch Linux.
Il sera facile de suivre ce tutoriel (j'espère jajaja).
J'ai eu quelques problèmes avec d'autres programmes (android-file-transfer and mtpfs),
Voici ce qui a fonctionné avec moi, j'espère que ça vous aide:

## Installez simple-mtpfs
Si vous n'avez pas ou ne sais pas ce qui est **Yaourt**, vérifiez ici d'abord:
https://angeloocana.com/en/blog/linux/arch/install-yaourt/

```bash
    yaourt -S simple-mtpfs
```

## Créer un dossier de destination
J'utiliserai le dossier **~/mnt**, vous pouvez l'utiliser, mais rappelez-vous pour l'étape suivante.
```bash
    mkdir ~/mnt
```

## Montez votre téléphone dans un dossier
```bash
    simple-mtpfs --device 1 ~/mnt
```

C'est ça! uhuhuh
Accédez au dossier **~/mnt**, vos fichiers sont là!

Guide officiel: https://wiki.archlinux.org/index.php/MTP
