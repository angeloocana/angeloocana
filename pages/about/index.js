import React from 'react'
import { Link } from 'react-router'
import { prefixLink } from 'gatsby-helpers'
import styled from 'styled-components'
import Footer from 'components/Footer'
import _Envelope from 'react-icons/lib/fa/envelope'
import _Check from 'react-icons/lib/fa/check'
import PageTitle from 'components/PageTitle'
import SocialLinks from './SocialLinks'


const I = styled.span`
  color: #666;
  font-size: 24px;
`

const C = styled(_Check)`
  color: #595;
  font-size: 15px;
  margin-left: -20px;
`

const Envelope = styled(_Envelope)`
  margin-left: -29px;
  margin-right: 7px;
  color: #999;
  font-size: 60px;
  padding: 10px;
  border-radius: 20%;
`

const Portrait = styled((p) => <div className={p.className}><img width={150} height={150} {...p} src='portrait.jpg' /></div>)`
  text-align: center;
  @media screen and (min-width: 480px) {
    float: right;
    margin-right: 0px;
    width: 200px;
    height: 200px;
    margin-top: 40px;
  }
  img {
    margin-top: 0;
    border-radius: 100%;
    padding: 0;
    border: 2px solid #6DB4F5;
    background: #6DB4F5;
    transform: rotate(9deg);
  }
`

const BorderLeft = styled.div`
    border-left: 3px solid #ddd;
    padding-left: 20px;
    margin-bottom:20px;
`

const ContactLink = styled(
  (p) =>
    <a
      href="https://docs.google.com/forms/d/1BxhAu46f-qdPS-SDYsdF3RS1W1yKR2mkSKy0K7OXLoI/viewform"
      target="_blank"
      rel="external"
    >
      <p className={p.className}>
        <Envelope className='icon' />
        <span>Ask me anything</span>
      </p>
    </a>
  )`
    .icon {
      transition-duration: 0.4s;
    }
    &:hover .icon {
      color: #5790C4;
    }
    span {
      border-bottom: 1px solid #ABDDFE;
      transition-duration: 0.2s;
    }
    &:hover span {
      border-bottom: 1px solid #007acc;
    }
  `

class Page extends React.Component {
  render () {
    return (
      <div>
        <PageTitle>About</PageTitle>

        <Portrait />

        <BorderLeft>
          Daniel Reszka is a:<br />
          <div
            style={{ paddingLeft: 40, margin: '10px 0'}}
          >
            <C /> <Link className='text-link' to={prefixLink('/dev/')}>Full-stack developer</Link> <small style={{color: 'gray'}}> (React / NodeJS / RoR)</small><br />
            <C /> <Link className='text-link' to={prefixLink('/gallery/')}>Digital artist</Link> <br />
            <C /> Freelancer<br />
            <C /> Minimalist<br />
            <C /> NLP master practitioner<br />
            <C /> Coach for IT teams and <br />project leaders
          </div>

          <p>living in Berlin, Germany</p>

        </BorderLeft>

        <ContactLink />

        <BorderLeft>
          Phone: +49 (0) 1575 160 1005<br />
          VAT: DE 298 753 316
        </BorderLeft>

        <SocialLinks />
      </div>
    )
  }
}

export default Page
