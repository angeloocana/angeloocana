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
    img: 'javascript.png'
  },
  'React': {
    years: range(2016, thisYear),
    tags: [tags.frontEnd],
    level: levels.expert,
    img: 'react.svg'
  },
  'GraphQL': {
    years: range(2016, thisYear),
    tags: [tags.backEnd],
    level: levels.proficient,
    img: 'graphql.svg'
  },
  'NodeJs': {
    years: range(2015, thisYear),
    tags: [tags.backEnd],
    level: levels.expert,
    img: 'nodejs.svg'
  },
  'MongoDB': {
    years: range(2015, thisYear),
    tags: [tags.db, tags.backEnd],
    level: levels.proficient,
    img: 'mongodb.svg'
  },
  'Gatsby': {
    years: range(2017, thisYear),
    tags: [tags.frontEnd],
    level: levels.proficient,
    img: 'gatsby.svg'
  },
  'Ramda': {
    years: range(2017, thisYear),
    tags: [tags.frontEnd, tags.backEnd],
    level: levels.proficient,
    img: 'ramda.svg',
    needWhiteBg: true
  },
  'Docker': {
    years: range(2017, thisYear),
    tags: [tags.backEnd],
    level: levels.proficient,
    img: 'docker.svg',
    needWhiteBg: true
  },
  'Arch Linux': {
    years: range(2015, thisYear),
    tags: [tags.os],
    level: levels.proficient,
    img: 'archlinux.svg'
  },
  'Debian': {
    years: range(2014, 2016),
    tags: [tags.os],
    level: levels.proficient,
    img: 'debian.png'
  },
  'Vim': {
    years: range(2015, thisYear),
    tags: [tags.textEditor],
    level: levels.proficient,
    img: 'vim.svg'
  },
  'vs code': {
    years: range(2015, thisYear),
    tags: [tags.textEditor],
    level: levels.expert,
    img: 'vscode.ico'
  },
  'Angular': {
    years: range(2014, 2016),
    tags: [tags.frontEnd],
    level: levels.expert,
    img: 'angular.svg'
  },
  'C#': {
    years: range(2008, 2016),
    tags: [tags.backEnd],
    level: levels.expert,
    img: 'csharp.svg'
  },
  '.net MVC': {
    years: range(2010, 2016),
    tags: [tags.frontEnd, tags.backEnd],
    level: levels.expert,
    img: 'asp_net_mvc.svg'
  },
  'web forms': {
    years: range(2008, 2012),
    tags: [tags.frontEnd, tags.backEnd],
    level: levels.expert,
    img: 'webforms.png'
  },
  'visual studio': {
    years: range(2007, 2016),
    tags: [tags.textEditor],
    level: levels.expert,
    img: 'vs.svg'
  },
  'JQuery': {
    years: range(2007, thisYear),
    tags: [tags.frontEnd],
    level: levels.expert,
    img: 'jquery.svg'
  },
  'SQL Server': {
    years: range(2008, 2016),
    tags: [tags.db, tags.backEnd],
    level: levels.expert,
    img: 'sql-server.svg'
  },
  'MySql': {
    years: range(2007, 2009),
    tags: [tags.db, tags.backEnd],
    level: levels.proficient,
    img: 'mysql.svg'
  },
  'PostgreSQL': {
    years: range(2014, 2015),
    tags: [tags.db, tags.backEnd],
    level: levels.proficient,
    img: 'postgresql.svg'
  },
  'PHP': {
    years: range(2008, 2010),
    tags: [tags.backEnd],
    level: levels.proficient,
    img: 'php.png'
  },
  'Access': {
    years: range(2007, 2008),
    tags: [tags.db, tags.backEnd],
    level: levels.novice,
    img: 'access.svg'
  },
  'VB.net': {
    years: range(2007, 2008),
    tags: [tags.backEnd],
    level: levels.novice,
    img: 'vb.svg'
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
    years: range(2013, thisYear),
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
    img: 'fiap.svg'
  },
  'UNIP': {
    subject: {
      pt: 'Análise e Desenvolvimento de Sistemas',
      en: 'Analysis and systems development',
      fr: 'Analyse et développement de systèmes'
    },
    fullName: 'Universidade Paulista',
    years: range(2013, 2014),
    img: 'unip.png'
  },
  'ITB': {
    subject: {
      pt: 'Web Design com Ênfase em Mídias Digitais',
      en: 'Web Design with Emphasis on Digital Media',
      fr: 'Conception Web avec accent sur les médias numériques'
    },
    fullName: 'Instituto Técnico de Barueri',
    years: range(2007, 2009),
    img: 'fieb.png'
  },
  'Inglês 200h': {
    years: range(2008, 2009),
    img: 'ingles200h.png',
    needWhiteBg: true,
    subject: {
      pt: 'Inglês',
      en: 'English',
      fr: 'Anglais'
    }
  }
};

const jobsAndClients = {

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
