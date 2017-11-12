---
title: Como configurar ssl https:// pro seu site
date: '2017-08-26'
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
  dateCreated: ...
  dateModified: ...
  datePublished: ...
  discussionUrl: ...
  educationalUse: ...    
  isAccessibleForFree: true
  isFamilyFriendly: true
  keywords: ...  
  thumbnailUrl: ...  
  video: ...
---

Como configurar **https://** usando **surge.sh** e **ssl.com**.
Foi um pouco difícil juntar todas as peças, espero poder ajudar quem esteja com problemas.

Você pode seguir o tutorial oficial aqui https://surge.sh/help/securing-your-custom-domain-with-ssl

Mas continue aqui, eu fiz algumas coisas bem diferentes e é focado no **ssl.com**

## Gerar arquivo .pem

```bash
    cat angeloocana_com.key angeloocana_com.crt 'SSL.com DV CA.crt' > surge3.pem
```

Eu tive problemas com o **chain**, meu https estava funcionando no chrome, mas não no firefox.
Quando eu testei no sslshopper.com, eu obtive esse erro:

> The certificate is not trusted in all web browsers. 
> You may need to install an Intermediate/chain certificate to link it to a trusted root certificate. 
> Learn more about this error. The fastest way to fix this problem is to contact your SSL provider.
> <cite>sslshopper</cite>

Eu resolvi isso adicionando **'SSL.com DV CA.crt'** como o terceiro arquivo na geração do arquivo .pem.

## Subir .pem pro surge.sh

```bash
    surge ssl
```

## Testar suas configurações
ssl tools é uma boa ferramenta para testar suas configurações de ssl e baixar arquivos que estejam faltando:
http://www.ssltools.com/
