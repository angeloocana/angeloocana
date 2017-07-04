---
title: React + Webpack + Karma + Express = ♥
path: /2015/08/Let-s-write-a-frontend/
sub: First steps & minimal setup
date: 2015-08-20 18:50:49
tags:
---

<!-- * https://github.com/new → Repository name: **my-frontend** -->

    $ mkdir my-frontend
    $ cd my-frontend
    $ git init
    $ npm init

<!--
        # git repository: git@github.com:danielres/my-frontend.git
        # author: Daniel Reszka
-->

    $ echo 'node_modules' >> .gitignore
    $ git add .gitignore
    $ git commit -m 'Add "node_modules" to .gitignore'

    $ git add package.json
    $ git commit -m 'Add bare "package.json" (npm init)'

<br />

    $ mkdir build
    $ echo 'hello world' >> build/index.html

<br />

    $ npm i -s webpack
      # same as: npm install --save webpack

    $ npm i -D webpack-dev-server
      # same as: npm install webpack-dev-server --save-dev


Add the lines starting with `"dev"` and `"build"` (lines 2 and 3) to `package.json`:

``` javascript
// package.json
"scripts": {
  "dev": "webpack-dev-server --devtool eval --progress --colors --content-base build",
  "build": "webpack",
  "test": "echo \"Error: no test specified\" && exit 1"
},
```

Let's check the result:

    $ npm run dev
    
    $ curl http://localhost:8080
      # => hello world
    
    $ google-chrome http://localhost:8080/webpack-dev-server/
      # => "Connecting to socket.io server..."

Let's add the minimum dependencies needed for developing with React, using .jsx on Webpack:

    $ npm i -s babel-core babel-loader react


Let's start with a basic configuration in `webpack.config.js`

``` javascript
// webpack.config.js
'use strict';

var webpack = require('webpack');

module.exports = {
  entry: [
    './app/main.jsx'
  ],
  resolve: {
    extensions: ['', '.js', '.jsx'],
    modulesDirectories: ['node_modules', 'app']
  },
  output: {
    path:     './build',
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.jsx$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader'
      }
    ]
  }
};
```

Let's add a basic `app/main.jsx` to make sure it’s working:

``` javascript
// app/main.jsx 
console.log("hello from app/main.jsx !!");
```

And let's run webpack:

    $ npm run build

And check the result:

    $ ls build
      # => bundle.js  index.html

Now if you run a:

    $ cat buils/bundle.js


Then, at the end of the output, you should see something like this:

``` javascript
/***/ },
/* 1 */
/***/ function(module, exports) {

  "use strict";

  console.log("hello from app/main.jsx !!");

/***/ }
/******/ ]);%
```

Which means Webpack recognised your source `app/main.jsx` and bundled it coorectly.
