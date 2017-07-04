import React from 'react'
import styled from 'styled-components'
import Footer from 'components/Footer'
import IGithub from 'react-icons/lib/fa/github'
import IWebLink from 'react-icons/lib/fa/globe'
import PageTitle from 'components/PageTitle'

const I = styled.span`
  font-size: 170%;
  color: gray;
  margin-right: 0.2em;
  position: relative;
  top: 1px;
`


const entries = [
  {
    anchor: 'boilerplate',
    name: 'React-redux-rails-oauth-boilerplate <br />',
    desc: `<p>An opensource boilerplate for modern web apps with decoupled frontend and backend using token authentication, with Facebook as an OAuth provider.</p>
           <p>Accelerates the development of these apps by providing a ready-to-use stack.</p>
           <p>Feel free to use/fork/contribute !</p>`,
    tags: ['React', 'Redux', 'Redux-sagas', 'Oauth', 'Rails', 'NodeJS', 'Rspec', 'TDD'],
    pic: 'react-redux-rails-oauth-boilerplate.jpg',
    links: {
      github: 'danielres/react-redux-rails-oauth-boilerplate',
      pic: 'https://github.com/danielres/react-redux-rails-oauth-boilerplate',
    }
  },
  {
    anchor: 'fde',
    name: 'Finedining Guide',
    desc: `<p>Built for the Berlin-based company "Seatris".</p>
           <p>For this web app, which is a guide and search engine of the world's finest restaurants, I built the whole frontend, using the most modern web technologies.</p>
           <p>I also built a new API inside the existing Rails backend, to address the specific needs of this new frontend.</p>
           <p>To visit and use the guide:</p>
           `,
    pic: 'finedining-guide-3-400x530.jpg',
    tags: ['React', 'Redux', 'Redis', 'Rails api', 'NodeJS', 'Responsive Design'],
    links: {
      pic: 'https://www.finediningexperiences.com/',
      web: {
        href: 'https://www.finediningexperiences.com/',
        text: 'finediningexperiences.com'
      }
    }
  },
  {
    anchor: 'oniryx-mp',
    name: 'Oniryx Marketplace',
    desc: `<p>As <a href="http://www.oniryx.be/" target="_blank" class="text-link">Oniryx</a>, a 30-people Belgian software engineering company, transitioned
           to a flat-hierarchy structure (<a href="http://www.holacracy.org/" target="_blank" class="text-link">holacracy</a>),
            the need for radically new collaboration tools became very apparent.</p>
           <p>I imagined and built for them this 100% custom platform, which reveals, in real-time, to all employees and collabrators,
           all the necessary information needed for individual and collective decision-making.</p>
           <p>For 2 years already, it is used as the company central hub, to centralize and access crucial information and keep everyone in sync.</p>
           <p class="mute">Links to source and demo are currently not available.</p>
           `,
    tags: ['Rails', 'Oauth', 'AngularJS', 'Rspec', 'TDD'],
    links: {
      // github: 'danielres/maketplace',
    }
  },
  {
    anchor: 'spirales',
    name: 'Spirales',
    tags: ['Rails', 'RefineryCMS', 'Custom Events Engine', 'Paypal SDK', 'Custom design', 'PDF generation'],
    desc: `<p>The offical website for a well-being association located near Reims, France.</p>
            <p>This website is built with <a class="text-link" href="http://www.refinerycms.com/" target"_blank">RefineryCMS</a>, and allows the client to have complete control over the contents.</p>
            <p>The association organizes frequent activities, therefore I developed an custom event engine as well as a secure booking
            & online payment system that uses the Paypal API.</p>`,
    pic: 'spirales-400x340.jpg',
    links: {
      pic: 'http://www.spirales.info/',
      web: { href: 'http://www.spirales.info/', text: 'spirales.info'}
    }
  },
  {
    anchor: 'wymeditor',
    name: 'WYMeditor',
    tags: ['Javascript', 'CSS'],
    pic: 'wymeditor-400x330.jpg',
    links: {
      pic: 'http://www.wymeditor.org/',
      github: 'wymeditor/wymeditor',
    },
    desc: `<p>
            Back in 2005, with <a href="http://hovinne.com/" target="_blank" class="text-link">Jean-François Hovinne</a>, we launched a new type of online editor,
            challenging the very concept of existing WYSYWIG editors, and allowing for higher-quality and more reliable output.
           </p>
           <p>
             WYMeditor is still improving and being used in a
             long and growing list of high-profile websites (see <a href="http://www.wymeditor.org/" class="text-link" target="_blank">Applications using WYMeditor</a>),
             such as
             <a href="http://www.kickstarter.com/" target="_blank" class="text-link">Kickstarter</a> and
             <a href="http://www.policystat.com/" target="_blank" class="text-link">PolicyStat</a>, and content management systems like
             <a href="http://www.refinerycms.com/" target="_blank" class="text-link">RefineryCMS</a>.
           </p>
           <p>
             I don't contribute anymore to WYMeditor, the project is now maintained by
             <a href="https://github.com/winhamwr" target="_blank" class="text-link">Wes Winham</a>
             and other contributors (who are doing an amazing job).
           </p>
           `,
  },
  {
    anchor: 'psynath',
    name: 'Nathalie Champougny',
    tags: ['Rails', 'RefineryCMS', 'Custom design'],
    desc: `<p>The professional website of psychologist Nathalie Champougny.</p>
           <p>This website is built with <a class="text-link" href="http://www.refinerycms.com/" target"_blank">RefineryCMS</a>, and allows Nathalie to have complete control over the contents.</p>
          `,
    pic: 'psynath-400x300.jpg',
    links: {
      pic: 'http://www.psynath.com/',
      web: {href: 'http://www.psynath.com/', text: 'psynath.com'},
    }
  },
  {
    anchor: 'expresto',
    name: 'Expresto',
    desc: `<p>Every language and culture have their own fascinating, colorful, surprising, funny or sad idiomatic expressions.</p>
           <p>With this personal project, I wanted to provide a collaborative platform to collect, share and learn about them, in all languages.</p>
           <p>Even though the platform is functional, I haven't had the time yet to communicate about
              it and develop it further. But I'd like to come back to it at some point.</p>
          `,
    tags: ['Rails', 'Rspec', 'TDD', 'I18n'],
    pic: 'expresto-400x360.jpg',
    links: {
      pic: 'http://expresto.herokuapp.com/en',
      github: 'danielres/expresto_BDD',
    }
  },
  {
    anchor: 'kizedec',
    name: 'Kizedec',
    tags: ['Rails', 'RefineryCMS'],
    desc: `<p>Personal website of life-coach Jean-Luc Champougny.</p>
           <p>This website is built with <a class="text-link" href="http://www.refinerycms.com/" target"_blank">RefineryCMS</a>, and allows Jean-Luc to have complete control over the contents.</p>
           <p>It also features a custom-made admin section to manage events and speakers.</p>
           `,
    pic: 'kizedec-400x300.jpg',
    links: {
      pic: 'http://www.kizedec.com/',
      web: {href: 'http://www.kizedec.com/', text: 'kizedec.com'},
    }
  },
  {
    anchor: 'mlvf ',
    name: 'Association C.G. Jung and M.L. Von Franz ',
    desc: `<p>Offical website for the association whose mission is to promote and study the works of Marie-Louise Von Franz, one of C.G Jung's most important associates.</p>
           <p>This website is built with <a class="text-link" href="http://www.refinerycms.com/" target"_blank">RefineryCMS</a>, and allows the association to have complete control over the contents.</p>
          `,
    tags: ['Rails', 'RefineryCMS', 'Custom design'],
    pic: 'mlvf-400x270.jpg',
    links: {
      pic: 'http://www.vonfranzjung.fr/',
      web: {href: 'http://www.vonfranzjung.fr/', text: 'vonfranzjung.fr'},
    }
  },
  {
    anchor: 'tempo',
    name: 'Tempo',
    desc: `<p>For years, I've been using the very useful <a href="https://github.com/projecthamster/hamster" target="_blank">Hamster app</a> to track my time on Ubuntu.</p>
           <p>I wanted to reduce manual work when generating the reports and timesheets that I attach to my invoices. So I created Tempo, which reads data directly from
              Hamster's sqlite database and generates these documents automatically.
           </p>
           <p>Tempo is opensource, feel free to use and adapt it to your needs.</p>
           `,
    tags: ['Sinatra', 'Ruby', 'DataMapper', 'Turnip (cucumber-like testing with Rspec)'],
    pic: 'tempo.jpg',
    links: {
      github: 'danielres/tempo',
      pic: 'https://github.com/danielres/tempo/',
    }
  },
  // {
  //   name: 'Pixarea Blog',
  //   pic: 'pixarea-blog.jpg',
  // },
  // {
  //   name: 'Pixarea',
  //   pic: 'pixarea.jpg',
  // },
]


const Entry = styled.div`
  padding: 20px 20px 1px;
  background: white;
  margin-bottom: 20px;
  border-radius: 10px;
  overflow: hidden;
  `

const EntryTitle = styled((p) =>
  <h3 className={p.className}>
    <span
      className='text'
      dangerouslySetInnerHTML={{ __html:  p.text}}
    />
    {p.tags  &&
      <small className='tags'>
        {p.tags.map((t) => <span key={t} className='tag'>{t}</span>)}
      </small>
    }
  </h3>
  )`
  font-weight: normal;
  margin-top: 0.2em;
  margin-bottom: 0.9em;
  .text {
    margin-right: 1.5em;
    display: inline-block;
    margin-bottom: 0.2em;
  }
  .tags {
    display: inline-block;
    text-transform: uppercase;
    line-height: 1.2;
  }
  .tag {
    min-width: 5em;
    text-align: center;
    display: inline-block;
    padding: 0 0.5em;
    font-size: 80%;
    color: gray;
    border-left: 1px solid #bbb;
    border-right: 1px solid #bbb;
    margin-right: -1px;
    &:last-child {
    }
  }
  `

const EntryContents = styled(({e, className}) => {
  const hasPic = e.pic ? 'hasPic' : ''
  return <div className={`${className}`}>
      <div className='pic'>
        {e.links && e.links.pic
          ? <a href={e.links.pic} title='Visit website' target='_blank'>
              <img src={e.pic} alt={e.name} title={`Project: ${e.name}`} />
            </a>
          : e.pic &&
            <img src={e.pic} alt={e.name} title={`Project: ${e.name}`} />
        }
      </div>
      <div className={hasPic}>
        {e.desc && <div className='desc' dangerouslySetInnerHTML={{ __html: e.desc }} /> }

        {e.links && e.links.github &&
          <p className='links'>
            <I><IGithub /></I>
            <a className='text-link' target="_blank" href={`https://github.com/${e.links.github}`}>{e.links.github}</a>
          </p>
        }

        {e.links && e.links.web &&
          <p className='links'>
            <I><IWebLink /></I>
            <a className='text-link' target="_blank" href={e.links.web.href}>{e.links.web.text}</a>
          </p>
        }
      </div>
    </div>
  })`
    .pic {
      @media screen and (min-width: 480px){
        float: left;
        width: 36%;
      }
      img {
        border: 4px solid transparent;
        border-radius: 10px;
        box-sizing: content-box;
        transition-duration: 0.4s;
        margin-left: -4px;
        margin-bottom: 1em;
        &:hover {
          border: 4px solid #58BCFF;
          background: #58BCFF;
        }
      }
    }
    .hasPic .desc,
    .hasPic .links {
      @media screen and (min-width: 480px){
        float: right;
        width: 60%;
      }
    }
    .desc {
      color: #444;
    }
    .desc,
    .links {
      line-height: 1.6;
      p {
        margin-bottom: 1.2em
      }
    }
  `

class Gallery extends React.Component {
  render () {
    return (
      <div>
        <PageTitle>Programming & Design</PageTitle>
        {entries.map((e) =>
          <Entry key={e.name} name={e.anchor} id={e.anchor}>
            <EntryTitle text={e.name} tags={e.tags} />
            <EntryContents e={e} />
          </Entry>
        )}
        <br />
        <Footer />
      </div>
    )
  }
}

export default Gallery
