---
title: 10 dicas para começar a usar Github e Linha de comando
date: '2017-09-21'
layout: post
draft: false
tags:
    - Git
    - versionamento de arquivos
structuredData:
  alternativeHeadline: ...  
  locationCreated: Ottawa CA
  type: TechArticle  
  dependencies: Um computador
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

Não perca mais seus arquivos! Mantenha um historico com todas as alterações, salve nas nuvems e fique tranquilo.

Aqui você vai aprender dicas simples pra se tornar um **NINJA** usando **Github** e **Linha de commando**.

### 1. Acesse [github.com](https://github.com).
  Click **Sign In** (Login) ou **Sign Up** (Cadastre-se).

### 2. Click no botão **Start a project** na página inicial.
  - Escolha o nome do Repositório, a URL do seu projecto vai ser
  github.com/USER-NAME/REPOSITORY-NAME
  - Click no botão **Create repository**

  Parabéns! O seu repositório esta pronto pra receber os arquivos que você nunca mais vai perder.

### 3. Instalar Git (Se você ja não tem instalado).
  - Arch linux: `pacman -S git`
  - Windows: Baixe e Instale https://git-for-windows.github.io/
  - Mac: Va para a App Store e Instale o **XCode**


### 4. Baixe o repositório para a sua máquina

Abra o terminal ou qualquer programa no seu computador que de acesso a linha de comando.

Digite os comandos abaixo para navegar entre as pastas do sistema ate encontrar a pasta desejada.

 - `ls` ou `dir` listam os arquivos e pastas do diretório atual.
 - `cd FOLDER_NAME` abre a pasta.
 - `cd ..` sobe um nível 1 pasta.


Clone o repositório para o seu PC:
```bash
    git clone https://github.com/YOUR_USER_NAME/REPOSITORY_NAME
```

Entre na pasta:
```bash
    cd REPOSITORY_NAME
```

uhuhuh Agora salve e adicione os seus arquivos para esta nova pasta.


### 5. Veja as alterações:
```bash
    git status
```


### 6. Adicione as alterações para um commit:
```bash
    git add .
```
  Não esqueça o ponto final **.**


### 7. Crie o commit
```bash
    git commit -m 'What did I... '
```
  Escreve uma mensagem curta explicando as alterações que você fez, tente manter um bom histórico.


### 8. Publicar! Salve seus arquivos e alterações na nuvem
```bash
    git push
```


### 9. Atualize sua versão local:
```bash
    git pull
```

### 10. Va dormir melhor sabendo que seus arquivos estão salvos.


Quer aprender coisa mais avançada? [Click aqui e se torne um ninja](https://angeloocana.com/pt/blog/git/git-setup/).
