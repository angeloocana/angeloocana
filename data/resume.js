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
  frontEnd: 'fronEnd',
  backEnd: 'backEnd'
};

const thisYear = (new Date()).getFullYear();

const technologies = {
  'React': {
    years: range(2016, thisYear),
    tags: [tags.frontEnd, tags.js],
    level: levels.expert
  },
  'Angular': {
    years: range(2014, 2016),
    tags: [tags.frontEnd, tags.js],
    level: levels.expert
  },
  'NodeJs': {
    years: range(2015, thisYear),
    tags: [tags.backEnd, tags.js],
    level: levels.expert
  },
  'Javascript': {
    years: range(2007, thisYear),
    tags: [tags.language, tags.js, tags.frontEnd, tags.backEnd],
    level: levels.expert
  },
  'C#': {
    years: range(2008, 2016),
    tags: [tags.language, tags.net, tags.backEnd],
    level: levels.expert
  },
  '.net MVC': {
    years: range(2008, 2016),
    tags: [tags.net, tags.backEnd],
    level: levels.expert
  },
  '.net WEP API': {
    years: range(2008, 2016),
    tags: [tags.net, tags.backEnd],
    level: levels.expert
  },
  'Ajax': {
    years: range(2011, thisYear),
    tags: [tags.js, tags.frontEnd],
    level: levels.expert
  },
  'MongoDB': {
    years: range(2015, thisYear),
    tags: [tags.db, tags.noSql, tags.backEnd],
    level: levels.proficient
  },
  'SQL Server': {
    years: range(2008, 2016),
    tags: [tags.db, tags.backEnd, tags.net],
    level: levels.expert
  },
  'MySql': {
    years: range(2007, 2009),
    tags: [tags.db, tags.backEnd],
    level: levels.proficient
  },
  'PostgreSQL': {
    years: range(2014, 2015),
    tags: [tags.db, tags.backEnd],
    level: levels.proficient
  },
  'Access': {
    years: range(2007, 2008),
    tags: [tags.db, tags.backEnd, tags.net],
    level: levels.novice
  },
  'VB.net': {
    years: range(2007, 2008),
    tags: [tags.language, tags.net, tags.backEnd],
    level: levels.novice
  },
  'PHP': {
    years: range(2008, 2010),
    tags: [tags.language, tags.backEnd],
    level: levels.proficient
  }
};

const getTechnologiesArray = (technologies) => {
  return Object.keys(technologies).map(key => {
    const tech = technologies[key];
    return {
      name: key,
      tags: tech.tags,
      level: tech.level,
      years: tech.years
    };
  });
};

module.exports = {
  technologies: getTechnologiesArray(technologies)
};
