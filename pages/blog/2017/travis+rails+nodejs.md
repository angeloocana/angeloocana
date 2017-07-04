---
title: Using Travis CI for Rails + Node.js
sub: How to set up travis.yml for multiple languages
date: 2017-02-08
path: "/2017/02/travis+rails+nodejs/"
---

I've been working lately on my boilerplate project for modern web apps with decoupled frontend and backend + Facebook and token authentication.

The project is open-source and available on Github: <br />[danielres/react-redux-rails-oauth-boilerplate](https://github.com/danielres/react-redux-rails-oauth-boilerplate)

This particular folder structure of the project is quite simple, the top directory just contains the subdirectories named "frontend" and "backend":

    .
    ├── backend
    │   ├── Gemfile
    │   └── ...
    ├── frontend
    │   ├── package.json
    │   └── ...
    └── README.md

But this is not such a common scenario for Travis CI, so it needs a custom configuration to be able to run all the tests for the frontend and for the backend.

After some experimentation, I came up with this `travis.yml` config, which works like a charm. I'm not sure this is the most elegant way to do it though, so feel welcome to share any improvement suggestions.

If you want, you can see the tests running here with this particular configuration: https://travis-ci.org/danielres/react-redux-rails-oauth-boilerplate

Here is the config file that makes it work:

```js
// travis.yml

{
  "language": "node_js",
  "node_js": "7.2.1",
  "addons": {
    "postgresql": "9.4"
  },
  "before_install": [
    "pwd",
    "rvm install 2.2.4",
    "gem install bundler",
    "nvm install 7.2.1"
  ],
  "install": [
    "cd frontend && npm install && cd ..",
    "cd backend && bundle && cd .."
  ],
  "before_script": [
    "psql -c 'create database test_db;' -U postgres",
    "cp backend/config/database.travis.yml backend/config/database.yml"
  ],
  "script": [
    "cd frontend && npm test && cd ..",
    "cd backend && rspec && cd .."
  ],
  "group": "stable",
  "dist": "precise",
  "os": "linux"
}
```



