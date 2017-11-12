---
title: Comment configurer ssl https:// pour votre site
date: '2017-08-30'
layout: post
draft: false
tags:
  - Gatsby
  - surge.sh
  - ssl.com
  - ssl
  - https
structuredData:
  version: 1
  locationCreated: Barueri BR  
  alternativeHeadline: Setup ssl
  type: TechArticle
  dependencies: Hosting at Surge.sh
  proficiencyLevel: Beginner
  articleSection: static-site
  pageEnd:
  pageStart:
  pagination:
  about:
    name: ssl
    alternateName: https
    description: SSL (Secure Sockets Layer) is the https:// thing you see in some urls, it adds security technology for establishing an encrypted link between a web server and a browser.
    identifier: ssl
    image:
    sameAs: https://en.wikipedia.org/wiki/Transport_Layer_Security
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
  video: ...
---

Comment configurer **https://** en utilisant **surge.sh** et **ssl.com**.
C'était un peu difficile de rassembler toutes les pièces, j'espère que je peux aider toute personne en difficulté.

Vous pouvez suivre le didacticiel officiel ici https://surge.sh/help/securing-your-custom-domain-with-ssl

Mais reste ici, j'ai fait des choses assez différentes et c'est axé sur **ssl.com**

## Générer le fichier .pem

```bash
    cat angeloocana_com.key angeloocana_com.crt 'SSL.com DV CA.crt' > surge3.pem
```


J'ai eu des problèmes avec la **chaîne**, mon https fonctionnait dans Chrome, mais pas dans Firefox.
Lorsque j'ai testé sur sslshopper.com, j'ai eu cette erreur:

> The certificate is not trusted in all web browsers. 
> You may need to install an Intermediate/chain certificate to link it to a trusted root certificate. 
> Learn more about this error. The fastest way to fix this problem is to contact your SSL provider.
> <cite>sslshopper</cite>


J'ai résolu cela en ajoutant **'SSL.com DV CA.crt'** comme troisième fichier dans la génération de fichiers .pem.

## Télécharger le fichier .pem sur surge.sh

```bash
    surge ssl
```

## Testez vos paramètres
ssl tools est un bon outil pour tester vos paramètres ssl et télécharger les fichiers manquants:
http://www.ssltools.com/
