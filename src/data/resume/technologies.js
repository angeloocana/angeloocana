const { range, thisYear } = require('./time');

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
  textEditor: 'Text Editor'
};

const technologies = {
  js: {
    name: 'Javascript',
    years: range(2007, thisYear),
    tags: [tags.frontEnd, tags.backEnd],
    level: levels.expert,
    img: 'javascript.png',
    link: 'https://en.wikipedia.org/wiki/JavaScript'
  },
  react: {
    name: 'React',
    years: range(2016, thisYear),
    tags: [tags.frontEnd],
    level: levels.expert,
    img: 'react.svg',
    link: 'https://facebook.github.io/react/'
  },
  'graphql': {
    name: 'GraphQL',
    years: range(2016, thisYear),
    tags: [tags.backEnd],
    level: levels.proficient,
    img: 'graphql.svg',
    link: 'http://graphql.org/'
  },
  nodejs: {
    name: 'NodeJs',
    years: range(2015, thisYear),
    tags: [tags.backEnd],
    level: levels.expert,
    img: 'nodejs.svg',
    link: 'https://nodejs.org'
  },
  mongodb: {
    name: 'MongoDB',
    years: range(2015, thisYear),
    tags: [tags.db, tags.backEnd],
    level: levels.proficient,
    img: 'mongodb.svg',
    link: 'https://www.mongodb.com/'
  },
  gatsby: {
    name: 'Gatsby',
    years: range(2017, thisYear),
    tags: [tags.frontEnd],
    level: levels.proficient,
    img: 'gatsby.svg',
    link: 'https://www.gatsbyjs.org/'
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
  docker: {
    name: 'Docker',
    years: range(2017, thisYear),
    tags: [tags.backEnd],
    level: levels.proficient,
    img: 'docker.png',
    needWhiteBg: true,
    link: 'https://www.docker.com/'
  },
  typeScript: {
    name: 'TypeScript',
    years: range(2015, thisYear),
    tags: [tags.frontEnd, tags.backEnd],
    level: levels.expert,
    img: '',
    link: ''
  },
  tslint: {
    name: 'TSLint',
    years: range(2015, thisYear),
    tags: [tags.frontEnd, tags.backEnd],
    level: levels.expert,
    img: '',
    link: ''
  },
  gulp: {
    name: 'Gulp',
    years: range(2015, 2016),
    tags: [tags.frontEnd],
    level: levels.expert,
    img: '',
    link: ''
  },
  jasmine: {
    name: 'Jasmine',
    years: range(2015, 2016),
    tags: [tags.frontEnd],
    level: levels.proficient,
    img: '',
    link: ''
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
    name: 'Angular',
    years: range(2014, 2016),
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
    img: '',
    link: ''
  },
  cordova: {
    name: 'Cordova',
    years: range(2015, thisYear),
    tags: [tags.frontEnd, tags.mobile],
    level: levels.proficient,
    img: '',
    link: ''
  },
  azure: {
    name: 'Azure',
    years: range(2015, thisYear),
    tags: [tags.cloud],
    level: levels.proficient,
    img: '',
    link: ''
  },
  amazon: {
    name: 'Amazon',
    years: range(2014, thisYear),
    tags: [tags.cloud],
    level: levels.novice,
    img: '',
    link: ''
  },
  eroku: {
    name: 'Eroku',
    years: range(2014, 2015),
    tags: [tags.cloud],
    level: levels.novice,
    img: '',
    link: ''
  },
  surge: {
    name: 'Surge',
    years: range(2017, thisYear),
    tags: [tags.cloud],
    level: levels.proficient,
    img: '',
    link: ''
  },
  cSharp: {
    name: 'C#',
    years: range(2008, 2016),
    tags: [tags.backEnd],
    level: levels.expert,
    img: 'csharp.svg',
    link: 'https://en.wikipedia.org/wiki/C_Sharp_(programming_language)'
  },
  netMvc: {
    name: '.net MVC',
    years: range(2010, 2016),
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
    img: '',
    link: ''
  },
  wpf: {
    name: 'WPF',
    years: range(2010, 2011),
    tags: [tags.frontEnd, tags.backEnd],
    level: levels.proficient,
    img: '',
    link: ''
  },
  lucene: {
    name: 'Lucene',
    years: range(2014, 2015),
    tags: [tags.backEnd],
    level: levels.proficient,
    img: '',
    link: ''
  },
  rabbitmq: {
    name: 'RabbitMQ',
    years: range(2014, 2015),
    tags: [tags.backEnd],
    level: levels.proficient,
    img: '',
    link: ''
  },
  structureMap: {
    name: 'StructureMap',
    years: range(2014, 2016),
    tags: [tags.backEnd],
    level: levels.expert,
    img: '',
    link: ''
  },
  entityFramework: {
    name: 'Entity Framework',
    years: range(2012, 2016),
    tags: [tags.backEnd],
    level: levels.expert,
    img: '',
    link: ''
  },
  wcf: {
    name: 'WCF',
    years: range(2011, 2015),
    tags: [tags.backEnd],
    level: levels.expert,
    img: '',
    link: ''
  },
  ext: {
    name: 'EXT .net',
    years: range(2010, 2011),
    tags: [tags.frontEnd],
    level: levels.proficient,
    img: '',
    link: ''
  },
  d3: {
    name: 'D3',
    years: range(2016, thisYear),
    tags: [tags.frontEnd],
    level: levels.proficient,
    img: '',
    link: ''
  },
  styledComponents: {
    name: 'Styled Components',
    years: range(2017, thisYear),
    tags: [tags.frontEnd],
    level: levels.proficient,
    img: '',
    link: ''
  },
  jest: {
    name: 'Jest',
    years: range(2017, thisYear),
    tags: [tags.frontEnd, tags.backEnd],
    level: levels.proficient,
    img: '',
    link: ''
  },
  eslint: {
    name: 'ESlint',
    years: range(2016, thisYear),
    tags: [tags.frontEnd, tags.backEnd],
    level: levels.proficient,
    img: '',
    link: ''
  },
  babel: {
    name: 'babel',
    years: range(2016, thisYear),
    tags: [tags.frontEnd, tags.backEnd],
    level: levels.proficient,
    img: '',
    link: ''
  },
  visualStudio: {
    name: 'visual studio',
    years: range(2007, 2016),
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
    years: range(2008, thisYear),
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
    years: range(2014, 2015),
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
    img: '',
    link: ''
  },
  flash: {
    name: 'Flash / Action Script',
    years: range(2007, 2010),
    tags: [tags.frontEnd],
    level: levels.proficient,
    img: '',
    link: ''
  },
  adobeFlex: {
    name: 'Adobe Flex Builder',
    years: range(2008, 2009),
    tags: [tags.frontEnd],
    level: levels.proficient,
    img: '',
    link: ''
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

module.exports = {
  technologies,
  tags,
  levels
};
