const range = (from, to) => {
  var list = [];
  for (var i = from; i <= to; i += 1) {
    list.push(i);
  }
  return list;
};

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

const thisYear = (new Date()).getFullYear();

const technologies = {
  'Javascript': {
    years: range(2007, thisYear),
    tags: [tags.frontEnd, tags.backEnd],
    level: levels.expert,
    img: 'javascript.png',
    link: 'https://en.wikipedia.org/wiki/JavaScript'
  },
  'React': {
    years: range(2016, thisYear),
    tags: [tags.frontEnd],
    level: levels.expert,
    img: 'react.svg',
    link: 'https://facebook.github.io/react/'
  },
  'GraphQL': {
    years: range(2016, thisYear),
    tags: [tags.backEnd],
    level: levels.proficient,
    img: 'graphql.svg',
    link: 'http://graphql.org/'
  },
  'NodeJs': {
    years: range(2015, thisYear),
    tags: [tags.backEnd],
    level: levels.expert,
    img: 'nodejs.svg',
    link: 'https://nodejs.org'
  },
  'MongoDB': {
    years: range(2015, thisYear),
    tags: [tags.db, tags.backEnd],
    level: levels.proficient,
    img: 'mongodb.svg',
    link: 'https://www.mongodb.com/'
  },
  'Gatsby': {
    years: range(2017, thisYear),
    tags: [tags.frontEnd],
    level: levels.proficient,
    img: 'gatsby.svg',
    link: 'https://www.gatsbyjs.org/'
  },
  'Ramda': {
    years: range(2017, thisYear),
    tags: [tags.frontEnd, tags.backEnd],
    level: levels.proficient,
    img: 'ramda.png',
    needWhiteBg: true,
    link: 'http://ramdajs.com/'
  },
  'Docker': {
    years: range(2017, thisYear),
    tags: [tags.backEnd],
    level: levels.proficient,
    img: 'docker.png',
    needWhiteBg: true,
    link: 'https://www.docker.com/'
  },
  'Arch Linux': {
    years: range(2015, thisYear),
    tags: [tags.os],
    level: levels.proficient,
    img: 'archlinux.svg',
    link: 'https://www.archlinux.org/'
  },
  'Debian': {
    years: range(2014, 2016),
    tags: [tags.os],
    level: levels.proficient,
    img: 'debian.png',
    link: 'https://www.debian.org/'
  },
  'Vim': {
    years: range(2015, thisYear),
    tags: [tags.textEditor],
    level: levels.proficient,
    img: 'vim.svg',
    link: 'https://vim.sourceforge.io'
  },
  'vs code': {
    years: range(2015, thisYear),
    tags: [tags.textEditor],
    level: levels.expert,
    img: 'vscode.png',
    link: 'https://code.visualstudio.com/'
  },
  'Angular': {
    years: range(2014, 2016),
    tags: [tags.frontEnd],
    level: levels.expert,
    img: 'angular.svg',
    link: 'https://angularjs.org/'
  },
  'C#': {
    years: range(2008, 2016),
    tags: [tags.backEnd],
    level: levels.expert,
    img: 'csharp.svg',
    link: 'https://en.wikipedia.org/wiki/C_Sharp_(programming_language)'
  },
  '.net MVC': {
    years: range(2010, 2016),
    tags: [tags.frontEnd, tags.backEnd],
    level: levels.expert,
    img: 'asp_net_mvc.svg',
    link: 'https://www.asp.net/mvc'
  },
  'web forms': {
    years: range(2008, 2012),
    tags: [tags.frontEnd, tags.backEnd],
    level: levels.expert,
    img: 'webforms.png',
    link: 'https://www.asp.net/web-forms'
  },
  'visual studio': {
    years: range(2007, 2016),
    tags: [tags.textEditor],
    level: levels.expert,
    img: 'vs.svg',
    link: 'https://www.visualstudio.com/'
  },
  'JQuery': {
    years: range(2008, thisYear),
    tags: [tags.frontEnd],
    level: levels.expert,
    img: 'jquery.svg',
    link: 'https://jquery.com/'
  },
  'HTML': {
    years: range(2007, thisYear),
    tags: [tags.frontEnd],
    level: levels.expert,
    img: 'html.png',
    link: 'https://www.w3schools.com/html/'
  },
  'CSS': {
    years: range(2007, thisYear),
    tags: [tags.frontEnd],
    level: levels.expert,
    img: 'css.svg',
    link: 'https://www.w3schools.com/css/'
  },
  'SQL Server': {
    years: range(2008, 2016),
    tags: [tags.db, tags.backEnd],
    level: levels.expert,
    img: 'sql-server.png',
    needWhiteBg: true,
    link: 'https://en.wikipedia.org/wiki/Microsoft_SQL_Server'
  },
  'MySql': {
    years: range(2007, 2009),
    tags: [tags.db, tags.backEnd],
    level: levels.proficient,
    img: 'mysql.png',
    link: 'https://www.mysql.com/'
  },
  'PostgreSQL': {
    years: range(2014, 2015),
    tags: [tags.db, tags.backEnd],
    level: levels.proficient,
    img: 'postgresql.svg',
    link: 'https://www.postgresql.org/'
  },
  'PHP': {
    years: range(2008, 2010),
    tags: [tags.backEnd],
    level: levels.proficient,
    img: 'php.png',
    link: 'http://php.net/'
  },
  'Access': {
    years: range(2007, 2008),
    tags: [tags.db, tags.backEnd],
    level: levels.novice,
    img: 'access.svg',
    link: 'https://en.wikipedia.org/wiki/Microsoft_Access'
  },
  'VB.net': {
    years: range(2007, 2008),
    tags: [tags.backEnd],
    level: levels.novice,
    img: 'vb.svg',
    link: 'https://en.wikipedia.org/wiki/Visual_Basic_.NET'
  },
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

const educations = {
  'Pluralsight': {
    years: range(2012, thisYear),
    link: 'https://app.pluralsight.com/profile/ocanaangelo',
    img: 'pluralsight.png',
    needWhiteBg: true,
    subject: {
      pt: 'Tecnologia e Design',
      en: 'Technology and Design',
      fr: 'Technologie et Design'
    }
  },
  'FIAP': {
    subject: {
      pt: 'Análise e Desenvolvimento de Sistemas',
      en: 'Analysis and systems development',
      fr: 'Analyse et développement de systèmes'
    },
    fullName: 'Faculdade de Informática e Administração Paulista',
    years: range(2010, 2011),
    img: 'fiap.svg',
    link: 'https://www.fiap.com.br'
  },
  'UNIP': {
    subject: {
      pt: 'Análise e Desenvolvimento de Sistemas',
      en: 'Analysis and systems development',
      fr: 'Analyse et développement de systèmes'
    },
    fullName: 'Universidade Paulista',
    years: range(2013, 2014),
    img: 'unip.png',
    link: 'https://www.unip.br/'
  },
  'FIEB': {
    subject: {
      pt: 'Web Design com Ênfase em Mídias Digitais',
      en: 'Web Design with Emphasis on Digital Media',
      fr: 'Conception Web avec accent sur les médias numériques'
    },
    fullName: 'Instituto Técnico de Barueri',
    years: range(2007, 2009),
    img: 'fieb.png',
    link: 'http://www.fieb.edu.br'
  },
  'Inglês 200h': {
    years: range(2008, 2009),
    img: 'ingles200h.png',
    needWhiteBg: true,
    subject: {
      pt: 'Inglês',
      en: 'English',
      fr: 'Anglais'
    },
    link: 'https://www.ingles200h.com/'
  }
};

const jobsAndClients = {
  '': {
    years: range(),
    img: '',
    link: ''
  },
  '': {
    years: range(),
    img: '',
    link: ''
  },
  '': {
    years: range(),
    img: '',
    link: ''
  },
};



const getArray = (list) => {
  return Object.keys(list).map(key => {
    const item = list[key];
    return {
      name: key,
      ...item
    };
  });
};

module.exports = {
  technologies: getArray(technologies),
  educations: getArray(educations),
  jobsAndClients: getArray(jobsAndClients)
};
