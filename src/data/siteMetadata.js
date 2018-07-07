const resume = require('./resume');
const languages = require('./languages');

module.exports = {
  siteUrl: 'https://angeloocana.com',
  author: {
    name: 'Ângelo Ocanã',
    homeCity: 'Ottawa',
    email: 'angeloocana@gmail.com',
    defaultLink: 'https://github.com/angeloocana'
  },
  sourceCodeLink: 'https://github.com/angeloocana/angeloocana',
  menu: [
    {label: 'home', slug: '/'},
    {label: 'posts', slug: '/blog/'},
    {label: 'tags', slug: '/tags/'},
    {label: 'about', slug: '/about/'},
    {
      label: 'resume', 
      slug: '/resume/',
      items: [
        {label: 'resume.technologies', slug: '/resume/technologies/'},
        {label: 'resume.jobsAndClients', slug: '/resume/jobsAndClients/'},
        {label: 'resume.educations', slug: '/resume/education'},
        {label: 'resume.languages', slug: '/resume/languages'}
      ]
    },
    {label: 'sourceCode', link: 'https://github.com/angeloocana/angeloocana'},
    {label: 'contact', slug: '/contact/'}
  ],  
  languages,
  resume,
  contact: [
    {
      type: 'email',
      value: 'angeloocana@gmail.com',
      link: 'mailto:angeloocana@gmail.com'
    },
    {
      type: 'phone',
      value: '(613) 558-9571',
      country: 'ca',
      link: 'tel:(613) 558-9571'
    },
    {
      type: 'phone',
      value: '+55 11 99572-9944',
      country: 'br',
      link: 'tel:+55 11 99572-9944'
    }
  ]
};
