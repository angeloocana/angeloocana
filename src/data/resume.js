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
  db: 'db',
  noSql: 'NoSQL',
  language: 'language',
  net: '.net',
  js: 'js',
  frontEnd: 'frontEnd',
  backEnd: 'backEnd'
};

const thisYear = (new Date()).getFullYear();

const technologies = {
  'React': {
    years: range(2016, thisYear),
    tags: [tags.frontEnd, tags.js],
    level: levels.expert,
    img: 'react.svg'
  },
  'Angular': {
    years: range(2014, 2016),
    tags: [tags.frontEnd, tags.js],
    level: levels.expert,
    img: 'angular.svg'
  },
  'NodeJs': {
    years: range(2015, thisYear),
    tags: [tags.backEnd, tags.js],
    level: levels.expert,
    img: 'nodejs.svg'
  },
  'Javascript': {
    years: range(2007, thisYear),
    tags: [tags.language, tags.js, tags.frontEnd, tags.backEnd],
    level: levels.expert,
    img: 'javascript.png'
  },
  'C#': {
    years: range(2008, 2016),
    tags: [tags.language, tags.net, tags.backEnd],
    level: levels.expert,
    img: 'csharp.svg'
  },
  '.net MVC': {
    years: range(2008, 2016),
    tags: [tags.net, tags.backEnd],
    level: levels.expert,
    img: 'asp_net_mvc.svg'
  },
  '.net WEP API': {
    years: range(2008, 2016),
    tags: [tags.net, tags.backEnd],
    level: levels.expert,
    img: ''
  },
  'Ajax': {
    years: range(2011, thisYear),
    tags: [tags.js, tags.frontEnd],
    level: levels.expert,
    img: ''
  },
  'MongoDB': {
    years: range(2015, thisYear),
    tags: [tags.db, tags.noSql, tags.backEnd],
    level: levels.proficient,
    img: ''
  },
  'SQL Server': {
    years: range(2008, 2016),
    tags: [tags.db, tags.backEnd, tags.net],
    level: levels.expert,
    img: ''
  },
  'MySql': {
    years: range(2007, 2009),
    tags: [tags.db, tags.backEnd],
    level: levels.proficient,
    img: ''
  },
  'PostgreSQL': {
    years: range(2014, 2015),
    tags: [tags.db, tags.backEnd],
    level: levels.proficient,
    img: ''
  },
  'Access': {
    years: range(2007, 2008),
    tags: [tags.db, tags.backEnd, tags.net],
    level: levels.novice,
    img: ''
  },
  'VB.net': {
    years: range(2007, 2008),
    tags: [tags.language, tags.net, tags.backEnd],
    level: levels.novice,
    img: ''
  },
  'PHP': {
    years: range(2008, 2010),
    tags: [tags.language, tags.backEnd],
    level: levels.proficient,
    img: ''
  }
};

const getTechnologiesArray = (technologies) => {
  return Object.keys(technologies).map(key => {
    const tech = technologies[key];
    return {
      name: key,
      ...tech
    };
  });
};

module.exports = {
  technologies: getTechnologiesArray(technologies)
};
