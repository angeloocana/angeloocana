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
  frontEnd: 'frontEnd',
  backEnd: 'backEnd'
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
  // 'Ramda': {
  //   years: range(),
  //   tags: [],
  //   level: levels.,
  //   img: ''
  // },
  // 'Docker': {
  //   years: range(),
  //   tags: [],
  //   level: levels.,
  //   img: ''
  // },
  // 'Arch Linux': {
  //   years: range(),
  //   tags: [],
  //   level: levels.,
  //   img: ''
  // },
  // 'Vim': {
  //   years: range(),
  //   tags: [],
  //   level: levels.,
  //   img: ''
  // },
  // 'vs code': {
  //   years: range(),
  //   tags: [],
  //   level: levels.,
  //   img: ''
  // },  
  'C#': {
    years: range(2008, 2016),
    tags: [tags.backEnd],
    level: levels.expert,
    img: 'csharp.svg'
  },
  '.net MVC': {
    years: range(2008, 2016),
    tags: [tags.backEnd],
    level: levels.expert,
    img: 'asp_net_mvc.svg'
  },
  // 'visual studio': {
  //   years: range(),
  //   tags: [],
  //   level: levels.,
  //   img: ''
  // },
  'JQuery': {
    years: range(2007, thisYear),
    tags: [tags.frontEnd],
    level: levels.expert,
    img: 'jquery.gif'
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
