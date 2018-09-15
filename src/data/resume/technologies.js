const { range, thisYear } = require('./time');
const R = require('ramda');

const levels = {
  novice: 'novice',
  proficient: 'proficient',
  expert: 'expert'
};

const tags = {
  db: 'DB',
  frontEnd: 'FrontEnd',
  backEnd: 'BackEnd',
  os: 'OS',
  textEditor: 'Text Editor',
  cloud: 'Cloud',
  mobile: 'Mobile'
};

const technologies = {
  js: {
    pinned: true,
    name: 'Javascript',
    years: range(2007, thisYear),
    tags: [tags.frontEnd, tags.backEnd],
    level: levels.expert,
    img: 'javascript.png',
    link: 'https://en.wikipedia.org/wiki/JavaScript'
  },
  nodejs: {
    pinned: true,
    name: 'NodeJs',
    years: range(2015, thisYear),
    tags: [tags.backEnd],
    level: levels.expert,
    img: 'nodejs.svg',
    link: 'https://nodejs.org'
  },
  react: {
    pinned: true,
    name: 'React',
    years: range(2016, thisYear),
    tags: [tags.frontEnd],
    level: levels.expert,
    img: 'react.svg',
    link: 'https://facebook.github.io/react/'
  },
  graphql: {
    pinned: true,
    name: 'GraphQL',
    years: range(2016, thisYear),
    tags: [tags.backEnd],
    level: levels.proficient,
    img: 'graphql.svg',
    link: 'http://graphql.org/'
  },
  mongodb: {
    pinned: true,
    name: 'MongoDB',
    years: range(2015, 2017),
    tags: [tags.db, tags.backEnd],
    level: levels.proficient,
    img: 'mongodb.svg',
    link: 'https://www.mongodb.com/'
  },
  gatsby: {
    pinned: true,    
    name: 'Gatsby',
    years: range(2017, thisYear),
    tags: [tags.frontEnd],
    level: levels.proficient,
    img: 'gatsby.svg',
    link: 'https://www.gatsbyjs.org/'
  },
  docker: {    
    name: 'Docker',
    years: range(2017, thisYear),
    tags: [tags.backEnd],
    level: levels.proficient,
    img: 'docker.png',
    needWhiteBg: true,
    link: 'https://www.docker.com/'
  },
  ramda: {
    name: 'Ramda',
    years: range(2017, thisYear),
    tags: [tags.frontEnd, tags.backEnd],
    level: levels.proficient,
    img: 'ramda.png',
    needWhiteBg: true,
    link: 'http://ramdajs.com/'
  },  
  typeScript: {
    name: 'TypeScript',
    years: range(2015, thisYear),
    tags: [tags.frontEnd, tags.backEnd],
    level: levels.expert,
    img: 'typescript.png',
    link: 'https://www.typescriptlang.org/'
  },
  // tslint: {
  //   name: 'TSLint',
  //   years: range(2015, thisYear),
  //   tags: [tags.frontEnd, tags.backEnd],
  //   level: levels.expert,
  //   needWhiteBg: true,
  //   img: 'tslint.png',
  //   link: 'https://palantir.github.io/tslint/'
  // },
  gulp: {
    name: 'Gulp',
    years: range(2015, 2016),
    tags: [tags.frontEnd],
    level: levels.expert,
    img: 'gulp.svg',
    link: 'https://gulpjs.com/'
  },
  jasmine: {
    name: 'Jasmine',
    years: range(2015, thisYear),
    tags: [tags.frontEnd],
    level: levels.proficient,
    img: 'jasmine.svg',
    link: 'https://jasmine.github.io/'
  },
  mocha: {
    name: 'mocha',
    years: range(2016, thisYear),
    tags: [tags.frontEnd, tags.backEnd],
    level: levels.expert,
    img: 'mocha.svg',
    link: 'https://mochajs.org/'
  },
  arch: {
    name: 'Arch Linux',
    years: range(2015, thisYear),
    tags: [tags.os],
    level: levels.proficient,
    img: 'archlinux.svg',
    link: 'https://www.archlinux.org/'
  },
  debian: {
    name: 'Debian',
    years: range(2014, 2016),
    tags: [tags.os],
    level: levels.proficient,
    img: 'debian.png',
    link: 'https://www.debian.org/'
  },
  vim: {
    name: 'Vim',
    years: range(2015, thisYear),
    tags: [tags.textEditor],
    level: levels.proficient,
    img: 'vim.svg',
    link: 'https://vim.sourceforge.io'
  },
  vscode: {
    name: 'vs code',
    years: range(2015, thisYear),
    tags: [tags.textEditor],
    level: levels.expert,
    img: 'vscode.png',
    link: 'https://code.visualstudio.com/'
  },
  angular: {
    name: 'AngularJS',
    years: range(2014, thisYear),
    tags: [tags.frontEnd],
    level: levels.expert,
    img: 'angular.svg',
    link: 'https://angularjs.org/'
  },
  ionic: {
    name: 'Ionic',
    years: range(2015, 2016),
    tags: [tags.frontEnd, tags.mobile],
    level: levels.proficient,
    img: 'ionic.png',
    link: 'https://ionicframework.com/'
  },
  cordova: {
    name: 'Cordova',
    years: range(2015, 2017),
    tags: [tags.frontEnd, tags.mobile],
    level: levels.proficient,
    needWhiteBg: true,
    img: 'cordova.svg',
    link: 'https://cordova.apache.org/'
  },
  azure: {
    name: 'Azure',
    years: range(2015, thisYear),
    tags: [tags.cloud],
    level: levels.proficient,
    img: 'azure.svg',
    link: 'https://azure.microsoft.com'
  },
  amazon: {
    name: 'Amazon',
    years: range(2014, thisYear),
    tags: [tags.cloud],
    level: levels.novice,
    needWhiteBg: true,
    img: 'amazon.svg',
    link: 'https://aws.amazon.com/'
  },
  eroku: {
    name: 'Eroku',
    years: range(2014, 2015),
    tags: [tags.cloud],
    level: levels.novice,
    img: 'heroku.svg',
    link: 'https://www.heroku.com'
  },
  surge: {
    name: 'Surge',
    years: range(2017, 2017),
    tags: [tags.cloud],
    level: levels.proficient,
    img: 'surge.svg',
    link: 'http://surge.sh'
  },
  cSharp: {
    name: 'C#',
    years: range(2008, thisYear),
    tags: [tags.backEnd],
    level: levels.expert,
    img: 'csharp.svg',
    link: 'https://en.wikipedia.org/wiki/C_Sharp_(programming_language)'
  },
  netMvc: {
    name: '.net MVC',
    years: range(2010, thisYear),
    tags: [tags.frontEnd, tags.backEnd],
    level: levels.expert,
    img: 'asp_net_mvc.svg',
    link: 'https://www.asp.net/mvc'
  },
  webForms: {
    name: 'web forms',
    years: range(2008, 2012),
    tags: [tags.frontEnd, tags.backEnd],
    level: levels.expert,
    img: 'webforms.png',
    link: 'https://www.asp.net/web-forms'
  },
  windowsForms: {
    name: 'windows forms',
    years: range(2008, 2012),
    tags: [tags.frontEnd, tags.backEnd],
    level: levels.expert,
    img: 'windowsforms.png',
    link: 'https://en.wikipedia.org/wiki/Windows_Forms'
  },
  wpf: {
    name: 'WPF',
    years: range(2010, 2011),
    tags: [tags.frontEnd, tags.backEnd],
    level: levels.proficient,
    img: 'wpf.png',
    link: 'https://en.wikipedia.org/wiki/Windows_Presentation_Foundation'
  },
  lucene: {
    name: 'Lucene',
    years: range(2014, 2015),
    tags: [tags.backEnd],
    level: levels.proficient,
    img: 'lucene.png',
    link: 'https://lucene.apache.org'
  },
  rabbitmq: {
    name: 'RabbitMQ',
    years: range(2014, 2015),
    tags: [tags.backEnd],
    level: levels.proficient,
    img: 'rabbitmq.svg',
    link: 'https://www.rabbitmq.com/'
  },
  structureMap: {
    name: 'StructureMap',
    years: range(2014, 2016),
    tags: [tags.backEnd],
    level: levels.expert,
    img: 'structuremap.png',
    link: 'http://structuremap.github.io/'
  },
  entityFramework: {
    name: 'Entity Framework',
    years: range(2012, 2016),
    tags: [tags.backEnd],
    level: levels.expert,
    img: 'entityframework.png',
    link: 'https://en.wikipedia.org/wiki/Entity_Framework'
  },
  wcf: {
    name: 'WCF',
    years: range(2011, 2015),
    tags: [tags.backEnd],
    level: levels.expert,
    img: 'wcf.png',
    link: 'https://en.wikipedia.org/wiki/Windows_Communication_Foundation'
  },
  ext: {
    name: 'EXT .net',
    years: range(2010, 2011),
    tags: [tags.frontEnd],
    needWhiteBg: true,
    level: levels.proficient,
    img: 'extnet.png',
    link: 'http://ext.net/'
  },
  // d3: {
  //   name: 'D3',
  //   years: range(2016, thisYear),
  //   tags: [tags.frontEnd],
  //   level: levels.proficient,
  //   img: 'd3.png',
  //   link: 'https://d3js.org/'
  // },
  sass: {
    name: 'SASS',
    years: range(2014, thisYear),
    tags: [tags.frontEnd],
    level: levels.expert,
    img: 'sass.svg',
    link: 'https://sass-lang.com/',
  },
  styledComponents: {
    name: 'Styled Components',
    years: range(2017, thisYear),
    needWhiteBg: true,
    tags: [tags.frontEnd],
    level: levels.proficient,
    img: 'styled-components.png',
    link: 'https://www.styled-components.com/'
  },
  jest: {
    name: 'Jest',
    years: range(2017, thisYear),
    tags: [tags.frontEnd, tags.backEnd],
    level: levels.proficient,
    img: 'jest.svg',
    link: 'https://facebook.github.io/jest/'
  },
  eslint: {
    name: 'ESlint',
    years: range(2016, thisYear),
    tags: [tags.frontEnd, tags.backEnd],
    level: levels.proficient,
    img: 'eslint.svg',
    link: 'https://eslint.org/'
  },
  babel: {
    name: 'babel',
    years: range(2016, thisYear),
    tags: [tags.frontEnd, tags.backEnd],
    level: levels.proficient,
    img: 'babel.svg',
    needWhiteBg: true,
    link: 'https://babeljs.io/'
  },
  webpack: {
    name: 'webpack',
    years: range(2016, thisYear),
    tags: [tags.frontEnd],
    level: levels.proficient,
    img: 'webpack.svg',
    link: 'https://webpack.js.org/'
  },
  visualStudio: {
    name: 'visual studio',
    years: range(2007, thisYear),
    tags: [tags.textEditor],
    level: levels.expert,
    img: 'vs.svg',
    link: 'https://www.visualstudio.com/'
  },
  dreamWeaver: {
    name: 'Dreamweaver',
    years: range(2007, 2016),
    tags: [tags.textEditor],
    level: levels.expert,
    img: 'vs.svg',
    link: 'https://www.visualstudio.com/'
  },
  jquery: {
    name: 'JQuery',
    years: range(2008, 2017),
    tags: [tags.frontEnd],
    level: levels.expert,
    img: 'jquery.svg',
    link: 'https://jquery.com/'
  },
  html: {
    name: 'HTML',
    years: range(2007, thisYear),
    tags: [tags.frontEnd],
    level: levels.expert,
    img: 'html.png',
    link: 'https://www.w3schools.com/html/'
  },
  css: {
    name: 'CSS',
    years: range(2007, thisYear),
    tags: [tags.frontEnd],
    level: levels.expert,
    img: 'css.svg',
    link: 'https://www.w3schools.com/css/'
  },
  sqlServer: {
    name: 'SQL Server',
    years: range(2008, 2016),
    tags: [tags.db, tags.backEnd],
    level: levels.expert,
    img: 'sql-server.png',
    needWhiteBg: true,
    link: 'https://en.wikipedia.org/wiki/Microsoft_SQL_Server'
  },
  mySql: {
    name: 'MySql',
    years: range(2007, 2009),
    tags: [tags.db, tags.backEnd],
    level: levels.proficient,
    img: 'mysql.png',
    link: 'https://www.mysql.com/'
  },
  postgres: {
    name: 'PostgreSQL',
    years: range(2014, thisYear),
    tags: [tags.db, tags.backEnd],
    level: levels.proficient,
    img: 'postgresql.svg',
    link: 'https://www.postgresql.org/'
  },
  php: {
    name: 'PHP',
    years: range(2008, 2010),
    tags: [tags.backEnd],
    level: levels.proficient,
    img: 'php.png',
    link: 'http://php.net/'
  },
  access: {
    name: 'Access',
    years: range(2007, 2008),
    tags: [tags.db, tags.backEnd],
    level: levels.novice,
    img: 'access.svg',
    link: 'https://en.wikipedia.org/wiki/Microsoft_Access'
  },
  vb: {
    name: 'VB .net',
    years: range(2007, 2008),
    tags: [tags.backEnd],
    level: levels.novice,
    img: 'vb.svg',
    link: 'https://en.wikipedia.org/wiki/Visual_Basic_.NET'
  },
  telerik: {
    name: 'Telerik',
    years: range(2008, 2010),
    tags: [tags.frontEnd],
    level: levels.proficient,
    img: 'telerik.png',
    link: 'http://www.telerik.com/'
  },
  flash: {
    name: 'Flash',
    years: range(2007, 2010),
    tags: [tags.frontEnd],
    level: levels.proficient,
    img: 'flash.png',
    link: 'http://www.adobe.com/Animate'
  },
  adobeFlex: {
    name: 'Flex',
    years: range(2008, 2009),
    tags: [tags.frontEnd],
    level: levels.proficient,
    img: 'flex.png',
    link: 'http://www.adobe.com/products/flex.html'
  }
  // 'Gimp': {
  //   years: range(2007, 2008),
  //   tags: [tags.backEnd],
  //   level: levels.novice,
  //   img: 'vb.svg'
  // },
  // 'Inkscape': {
  //   years: range(2007, 2008),
  //   tags: [tags.backEnd],
  //   level: levels.novice,
  //   img: 'vb.svg'
  // },
};

const throwErrorForNullTags = (techs) => {
  R.values(techs).forEach(t =>
    t.tags.forEach(tag => {
      if (!tag) throw new Error('Null tag for ' + t.name);
    }));

  return techs;
};

module.exports = {
  technologies: throwErrorForNullTags(technologies),
  tags,
  levels
};
