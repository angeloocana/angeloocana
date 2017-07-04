import React from 'react'
import access from 'safe-access'
import include from 'underscore.string/include'
import { Link as _Link } from 'react-router'
import { prefixLink } from 'gatsby-helpers'
import { rhythm, scale } from 'utils/typography'
import { config } from 'config'
import styled from 'styled-components'
import _Ribbon from '../components/Ribbon'
import IHome from 'react-icons/lib/ti/home'
import _ICode from 'react-icons/lib/io/code'
import IPicture from 'react-icons/lib/io/android-color-palette'
import _IAbout from './AboutIcon'
import './styles.scss'

const Container = (props) =>
  <div style={{
      maxWidth: rhythm(28),
      padding: `${rhythm(1.5)} ${rhythm(3/4)}`,
      margin: 'auto',
    }}
  >
    {props.children}
  </div>


const Ribbon = styled(
  (p) =>
    <div {...p}>
      <_Ribbon href='/cv/' />
    </div>
  )`
    position: fixed;
    z-index: 100;
    top: 20px;
    right: -85px;
    display: inline-block;
    transform: rotate(40deg);
    -webkit-backface-visibility: hidden;

  `

const ICode = () =>
  <_ICode style={{position: 'relative', left: 1.5}} />

const IAbout = () =>
  <_IAbout style={{position: 'relative', left: 3, top: -4}} />

const Link = (props) =>
  <_Link {...props} activeClassName='active' onlyActiveOnIndex={true}/>

const I = styled.span`
  font-size: 30px;
  display: inline-block;
  margin: 30px 10px 30px;
  a {
    color: #444;
    box-shadow: none;
    background: transparent;
    padding: 10px 11px;
    border-radius: 100%;
    display: inline-block;
    text-align: center;
    transition-duration: 0.2s;
    &.active,
    &:hover{
      background: white;
    }
  }
`

class Template extends React.Component {
  render () {
    const { location, children } = this.props
    const header =
      <div>
        <div style={{textAlign: 'center'}}>
          <I>
            <Link
              title="Articles"
              to={prefixLink('/')}
            >
              <IHome />
            </Link>
          </I>

          <I>
            <Link
              title="Programming"
              to={prefixLink('/dev/')}
            >
              <ICode />
            </Link>
          </I>

          <I>
            <Link
              title="Creations"
              to={prefixLink('/gallery/')}
            >
              <IPicture />
            </Link>
          </I>

          <I>
            <Link
              title="About"
              to={prefixLink('/about/')}
            >
              <IAbout />
            </Link>
          </I>
        </div>
      </div>

    return (
      include(access(this, 'props.location.pathname'), '/cv/')
      ? <div>{children}</div>
      : <Container>
          <Ribbon />
          {header}
          <div className='main'>
            {children}
          </div>
        </Container>
    )
  }
}

Template.propTypes = {
  children: React.PropTypes.any,
  location: React.PropTypes.object,
  route: React.PropTypes.object,
}

export default Template
