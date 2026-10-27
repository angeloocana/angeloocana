---
title: 10 tips to Start using Github and Command line
date: '2017-09-21'
layout: post
draft: false
tags:
    - Git
    - version control
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

Do NOT lose your files anymore! Keep track of the history change, save to the cloud and be safe.
Here you are going to learn simple tips to become a **NINJA** using **Github** and the **command line**.

### 1. Go to [github.com](https://github.com).
  **Sign In** or **Sign Up**.

### 2. Click the button **Start a project** in the home page.
  - Choose a Repository Name, the URL for your project will be 
  github.com/USER-NAME/REPOSITORY-NAME
  - Click the button **Create repository**

  Congratulations! Your repository is ready to receive the files that you will never lose anymore.


### 3. Install Git (If you don't have it).
  - Arch linux: `pacman -S git`
  - Windows: Download and install https://git-for-windows.github.io/
  - Mac: Go to App Store and Install **XCode**


### 4. Go to your folder and add files

Open the terminal or command line tool available on your system.

Type the commands bellow to go to the folder where you want your files to live in:

 - `ls` or `dir` list the files and directories.
 - `cd FOLDER_NAME` open the folder.
 - `cd ..` go up 1 folder level.


Clone the repository to your PC:
```bash
    git clone https://github.com/YOUR_USER_NAME/REPOSITORY_NAME
```

```bash
    cd REPOSITORY_NAME
```

uhuhuh Now Save or Add any file you want to the folder.


### 5. See the changes:
```bash
    git status
```

### 6. Add the changes to commit:
```bash
    git add .
```
  Don't forget the dot **.**

### 7. Create the commit
```bash
    git commit -m 'What did I... '
```
  Write a short message saying what you have changed, Try to keep a good history log.

### 8. Publish! Save your files and changes to the cloud.
```bash
    git push
```

### 9. Keep your local version update:
```bash
    git pull
```

### 10. Go sleep better knowing that your files are safe.


Want to learn more advanced stuff? [Click here to become a NINJA](https://angeloocana.com/en/blog/git/git-setup/).
