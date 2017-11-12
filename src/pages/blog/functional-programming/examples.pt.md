---
title: Exemplos Programação Funcional
date: '2017-06-23'
layout: post
draft: false
tags:
    - Programação Funcional
readNext:
    - /pt/blog/js/spred-operator/
    - /pt/blog/vim/vim-help-commands/
    - /pt/blog/terminal/install-zsh/
structuredData:
  locationCreated: Barueri BR
  alternativeHeadline: ...
  type: TechArticle  
  dependencies: Javascript basics
  proficiencyLevel: Beginner
  articleSection: Functional Programming
  pageEnd: ...
  pageStart: ...
  pagination: ...
  about:
    name: Functional Programming
    alternateName: FP
    description: Functional Programming is a programming style or pattern
      which compose pure functions to build a software.
    identifier: functional-programming
    image: ...
    sameAs: https://en.wikipedia.org/wiki/Functional_programming
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

```js
var log = console.log;

function identity(x) {
    return x;
}

function add(a, b) {
    return a + b;
}

function mul(a, b) {
    return a * b;
}

function identityf(x) {
    return function () {
        return x;
    }
}

function addf(a) {
    return function (b) {
        return a + b;
    }
}

function applyf(f) {
    return function (a) {
        return function (b) {
            return f(a, b);
        }
    }
}

// log(applyf(mul)(5)(6));

function curry_ab(f, a) {
    return applyf(f)(a);
}

function curry(f, ...a) {
    return function (...b) {
        return f(...a, ...b);
    }
}

// log(curry(add, 2)(3));
///////////////////////////////////////////////////////

///////////////////////////////////////////////////////
//
// Without writing any new functions,
// show three ways to create the inc function.
//
// inc(5) // 6
// inc(inc(5)) // 7

var inc_1 = curry(add, 1);

log(inc_1(5));
log(inc_1(inc_1(5)));

var inc_2 = applyf(add)(1);

log(inc_2(5));
log(inc_2(inc_2(5)));

var inc_3 = addf(1);

log(inc_3(5));
log(inc_3(inc_3(5)));

//
///////////////////////////////////////////////////////


log('///////////////////////////////////////////////\n' +
    '//                                             \n' +
    '// Write methodize, a function                 \n' +
    '// that converts a binary function             \n' +
    '// to a method.                                \n' +
    '//                                             \n' +
    '// Number.prototype.add = methodize(add);      \n' +
    '// (3).add(4) // 7                             \n' +
    '\n');

function methodize(f) {
    return function (...b) {
        return f(this, ...b);
    };
}

Number.prototype.add = methodize(add);
log('(3).add(4) ==> ', (3).add(4));


log('//                                             \n' +
    '///////////////////////////////////////////////\n');


log('///////////////////////////////////////////////\n' +
    '//                                             \n' +
    '// Write demethodize, a                        \n' +
    '// function that converts a                    \n' +
    '// method to a binary function.                \n' +
    '//                                             \n' +
    '// demethodize(Number.prototype.add)(5, 6)     \n' +
    '// // 11                                       \n');

function demethodize(f) {
    return function (that, ...b) {
        return f.call(that, ...b);
    }
}

log(demethodize(Number.prototype.add)(5, 6));


log('//                                             \n' +
    '///////////////////////////////////////////////\n');


log('///////////////////////////////////////////////\n' +
    '//                                             \n' +
    '// Write a function twice that                 \n' +
    '// takes a binary function and                 \n' +
    '// returns a unary function that               \n' +
    '// passes its argument to the                  \n' +
    '// binary function twice.                      \n' +
    '//                                             \n' +
    '// var double = twice(add);                    \n' +
    '// double(11); // 22                           \n' +
    '//                                             \n' +
    '// var square = twice(mul);                    \n' +
    '// square(11); // 121                          \n' +
    '//                                             \n');

function twice(binary) {
    return function (a) {
        return binary(a, a);
    }
}

var double = twice(add);
log(double(11)); // 22       

var square = twice(mul);
log(square(11)); // 121


log('//                                             \n' +
    '///////////////////////////////////////////////\n');


log('///////////////////////////////////////////////\n' +
    '//                                             \n' +
    '// Write a function composeu                   \n' +
    '// that takes two unary functions              \n' +
    '// and returns a unary function                \n' +
    '// that calls them both.                       \n' +
    '//                                             \n' +
    '// composeu(double, square)(3); // 36          \n' +
    '//                                             \n');

function composeu(f1, f2) {
    return function (a) {
        return f2(f1(a));
    }
}

log(composeu(double, square)(3));


log('//                                             \n' +
    '///////////////////////////////////////////////\n');


log('///////////////////////////////////////////////\n' +
    '//                                             \n' +
    '// Write a function composeb                   \n' +
    '// that takes two binary functions             \n' +
    '// and returns a function that                 \n' +
    '// calls them both.                            \n' +
    '//                                             \n' +
    '// composeb(add, mul)(2, 3, 5);  //25          \n' +
    '//                                             \n' +
    '//                                             \n');

function composeb(f1, f2) {
    return function (a, b, c) {
        return f2(f1(a, b), c);
    }
}

log(composeb(add, mul)(2, 3, 5));  //25


log('//                                             \n' +
    '///////////////////////////////////////////////\n');

log('///////////////////////////////////////////////\n' +
    '//                                             \n' +
    '// Write a function that allows                \n' +
    '// another function to only be                 \n' +
    '// called once.                                \n' +
    '//                                             \n' +
    '// add_once = once(add);                       \n' +
    '// add_once(3, 4); // 7                        \n' +
    '// add_once(3, 4); // throw                    \n' +
    '//                                             \n');

function once_test(f) {
    var called = false;
    return function (a, b) {
        if (!called) {
            called = true;
            return f(a, b);
        } else {
            throw 'Called more than once';
        }
    };
}

function once(func) {
    return function () {
        var f = func;
        func = null;
        return f.apply(this, arguments);
    };
}

add_once = once(add);

log(add_once(3, 4)); // 7
try {
    add_once(3, 4)
} catch (e) {
    log('throw error');
}

log('//                                             \n' +
    '///////////////////////////////////////////////\n');

log('///////////////////////////////////////////////\n' +
    '//                                             \n' +
    '// Write a factory function that               \n' +
    '// returns two functions that                  \n' +
    '// implements an up/down counter.              \n' +
    '//                                             \n' +
    '// counter = counterf(10);                     \n' +
    '// counter.inc(); // 11                        \n' +
    '// counter.dec(); // 10                        \n' +
    '//                                             \n');

function counterf(n) {
    return {
        inc: function () {
            n = n + 1;
            return n;
        },
        dec: function () {
            n = n - 1;
            return n;
        }
    }
}

var counter = counterf(10);
log(counter.inc()); // 11
log(counter.dec()); // 10

log('//                                             \n' +
    '///////////////////////////////////////////////\n');

log('///////////////////////////////////////////////\n' +
    '//                                             \n' +
    '// Make a revocable function that takes        \n' +
    '// a nice function, and returns a              \n' +
    '// revoke function that denies access          \n' +
    '// to the nice function, and an invoke         \n' +
    '// function that can invoke the nice           \n' +
    '// function until it is revoked.               \n' +
    '//                                             \n' +
    '// temp = revocable(alert);                    \n' +
    '// temp.invoke(7); // alert: 7                 \n' +
    '// temp.revoke();                              \n' +
    '// temp.invoke(8); // throw!                   \n' +
    '//                                             \n');

function revocable(f) {
    var access = true;
    return {
        invoke: function () {
            return f.apply(this, arguments);
        },
        revoke: function () {
            f = null;
        }
    }
}

var temp = revocable(log);
temp.invoke(7); // alert: 7
temp.revoke();
try {
    temp.invoke(8); // throw!
} catch (e) {
    log('throw error');
}


log('//                                             \n' +
    '///////////////////////////////////////////////\n');

log('///////////////////////////////////////////////\n' +
    '//                                             \n' +
    '//                                             \n' +
    '//                                             \n' +
    '//                                             \n' +
    '//                                             \n' +
    '//                                             \n' +
    '//                                             \n');



log('//                                             \n' +
    '///////////////////////////////////////////////\n');
```
