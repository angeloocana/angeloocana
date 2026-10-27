---
title: Js Exemplos Spred Operator
date: '2017-06-23'
layout: post
draft: false
tags:
  - JavaScript
  - ES6
  - ES2015
---

# Exemplos Javascript Spread Operator

```js
    const a = [1, 2, 3];
    const b = [a, 4, 5, 6];
    const c = [...a, 4, 5, 6];

    console.log(b); // [ [ 1, 2, 3 ], 4, 5, 6 ]
    console.log(c); // [ 1, 2, 3, 4, 5, 6 ]

    function teste(...args) {
        console.log('', ...args); // 1 2 3 4 5 6
        console.log(args); // [ 1, 2, 3, 4, 5, 6 ]
    }

    teste(1, 2, 3, 4, 5, 6);
```
