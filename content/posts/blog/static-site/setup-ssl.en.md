---
title: How to setup ssl https:// for your site
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

How to setup https / ssl for surge.sh and ssl.com, It was hard to grab all the pieces,
So I hope I can help who is in trouble.

You can follow the oficial tutorial at https://surge.sh/help/securing-your-custom-domain-with-ssl
But keep checking here, I did somethings different and it is focused to ssl.com

## Generate .pem file

```bash
    cat angeloocana_com.key angeloocana_com.crt 'SSL.com DV CA.crt' > surge3.pem
```

I had problems with the chain, my https was working in chrome but not in firefox.
When I tested on sslshopper.com I get this error:

> The certificate is not trusted in all web browsers. 
> You may need to install an Intermediate/chain certificate to link it to a trusted root certificate. 
> Learn more about this error. The fastest way to fix this problem is to contact your SSL provider.
> <cite>sslshopper</cite>

I solved it by adding **'SSL.com DV CA.crt'** as the third file when generating the .pem file.

## Upload .pem to surge.sh

```bash
    surge ssl
```

## Test your confs
ssl tools is a great way to test your ssl configuration and download missing files:
http://www.ssltools.com/
