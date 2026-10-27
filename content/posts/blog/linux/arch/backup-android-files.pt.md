---
title: Como salvar fotos do celular pro Arch Linux
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
  dependencies: Arch Linux e Celular Android
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

O seu telefone esta lotado? Faça backup dos seus arquivos pro Arch Linux.
Vai ser fácil seguindo este tutorial (Eu espero hahaha).
Eu tive alguns problemas com outros programas (android-file-transfer e mtpfs),
segue aqui o que funcionou comigo, espero que ajude:

## Instalar simple-mtpfs
Se você não tem ou não sabe o que é **Yaourt**, por favor confira aqui primeiro:
https://angeloocana.com/en/blog/linux/arch/install-yaourt/

```bash
    yaourt -S simple-mtpfs
```

## Criar pasta de destino
Eu vou usar a pasta **~/mnt**, você pode usar qualquer uma, mas lembre-se dela para a próxima etapa.
```bash
    mkdir ~/mnt
```

## Monte seu telefone para uma pasta
```bash
    simple-mtpfs --device 1 ~/mnt
```

É isso ai! uhuhuh
Acesse a pasta **~/mnt**, seus arquivos estão lá!

Guia oficial: https://wiki.archlinux.org/index.php/MTP
