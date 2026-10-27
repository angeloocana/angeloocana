---
title: 10 conseils pour commencer à utiliser Github et la ligne de commande
date: '2017-09-21'
layout: post
draft: false
tags:
    - Git
    - contrôle de version
structuredData:
  alternativeHeadline: ...  
  locationCreated: Ottawa CA
  type: TechArticle  
  dependencies: A computer
  proficiencyLevel: Beginner
  articleSection: Git
  pageEnd: ...
  pageStart: ...
  pagination: ...
  about:
    name: Git
    alternateName: Github
    description: Git is a free and open source distributed version control system designed to handle everything from small to very large projects with speed and efficiency.
    identifier: git
    image: ...
    sameAs: https://git-scm.com/
  accessMode: textual
  accessModeSufficient: textual
  accessibilityAPI: ARIA
  accessibilityControl: fullKeyboardControl, fullTouchControl, fullMouseControl
  accessibilitySummary: ...
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
  version: 1
  video: ...
---

Ne perdez plus vos fichiers! Gardez une trace du changement d'historique, enregistrez le nuage et soyez en sécurité.


Ici, vous apprendrez des conseils simples pour devenir un **NINJA** en utilisant **Github** et **la ligne de commande**.

### 1. Aller à [github.com](https://github.com).
  **Sign In** or **Sign Up** (Connectez-vous ou inscrivez-vous).

### 2. Cliquez sur le bouton **Start a project** dans la page d'accueil.
  - Choisissez un nom de dépôt, l'URL de votre projet sera
  github.com/USER-NAME/REPOSITORY-NAME
  - Cliquez sur le bouton **Create repository**

  Toutes nos félicitations! Votre dépôt est prêt à recevoir les fichiers que vous ne perdrez plus.


### 3. Installez Git (si vous ne l'avez pas).
  - Arch linux: `pacman -S git`
  - Windows: Télécharger et installer https://git-for-windows.github.io/
  - Mac: Aller à l'App Store et à installer **XCode**


### 4. Accédez à votre dossier et ajoutez des fichiers

Ouvrez le terminal ou l'outil de ligne de commande disponible sur votre système.

Tapez les commandes ci-dessous pour accéder au dossier dans lequel vous souhaitez que vos fichiers vivent:

 - `ls` ou `dir` liste les fichiers et les répertoires.
 - `cd FOLDER_NAME` ouvrez le dossier.
 - `cd ..` monter 1 niveau de dossier.


Cloner le dépôt sur votre PC:
```bash
    git clone https://github.com/YOUR_USER_NAME/REPOSITORY_NAME
```

```bash
    cd REPOSITORY_NAME
```

uhuhuh Maintenant, enregistrez ou Ajoutez un fichier que vous voulez sur le dossier.


### 5. Voir les changements:
```bash
    git status
```

### 6. Ajouter les modifications à commettre:
```bash
    git add .
```  
  N'oubliez pas le point **.**

### 7. Créer le commit
```bash
    git commit -m 'What did I... '
```
  Écrivez un court message indiquant ce que vous avez modifié, essayez de conserver un bon journal d'historique.

### 8. Publier! Enregistrez vos fichiers et modifiez le nuage.
```bash
    git push
```

### 9. Conservez la mise à jour de votre version locale:
```bash
    git pull
```

### 10. Allez dormir mieux en sachant que vos fichiers sont sécurisés.

Vous voulez apprendre des choses plus avancées? [Cliquez ici pour devenir NINJA](https://angeloocana.com/en/blog/git/git-setup/).
