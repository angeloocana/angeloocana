const authors = {
  angeloocana: {
    name: 'Angelo Ocana Martins',
    additionalName: 'angeloocana',
    address: 'Ottawa CA',
    affiliation: 'Polutz',
    birthDate: '1992-06-28',
    birthPlace: 'Carapicúiba BR',
    brand: 'Ângelo Ocanã Web Apps Development and Training',
    children: {
      additionalName: 'Ana Julia Rodriguez Ocana',
      name: 'Ana Júlia Rodriguez Ocanã',
      givenName: 'Ana Julia',
      familyName: 'Ocanã',
      gender: 'Female',
      nationality: 'Brazilian',
      homeLocation: 'Ottawa'
    },
    email: 'angeloocana@gmail.com',
    familyName: 'Ocanã',
    gender: 'Male',
    givenName: 'Angelo',
    height: '...',
    homeLocation: 'Ottawa',
    jobTitle: 'Software Engineer',
    knows: '...',
    memberOf: '...',
    nationality: 'Brazilian',
    owns: '...',
    parent: '...',
    performerIn: '...',
    publishingPrinciples: '...',
    relatedTo: '...',
    seeks: '...',
    sibling: '...',
    spouse: {
      additionalName: 'Gabriela Rodriguez de Almeida',
      name: 'Gabriela Rodriguez de Almeida',
      givenName: 'Gabriela',
      familyName: 'Rodriguez',
      gender: 'Female',
      nationality: 'Brazilian',
      homeLocation: 'Ottawa'
    },
    telephone: '...',
    weight: '...',
    workLocation: '...',
    worksFor: '...',
    description: '...',
    disambiguatingDescription: '...',
    identifier: '...',
    image: 'http://www.gravatar.com/avatar/9174fca44b5ca403593ac9cb2407e0e7',
    sameAs: 'https://angeloocana.com/en/about/',
    url: 'https://angeloocana.com/en/about/'
  }
};

const getAuthor = (id) => {
  const author = {
    ...authors[id],
    '@type': 'Person'
  };
  return author
    ? author
    : authors[0];
};

export default {
  authors,
  getAuthor
};
