import React from 'react'
import { Link } from 'react-router'
import moment from 'moment'
import styled from 'styled-components'
import CvLink from './CvLink'
import IHome from 'react-icons/lib/ti/home'
import ICode from 'react-icons/lib/io/code'
import IPicture from 'react-icons/lib/io/android-color-palette'
import IAbout from '../AboutIcon'

const Portrait = styled(
    (p) =>
      <div className={p.className}>
        <img width={150} height={150} src='/static/img/cv-portrait-345x345.jpg' />
      </div>
  )`
  text-align: center;
  img {
    width: 150px;
    border-radius: 100%;
    margin-bottom: 0.5em;
  }
  `

const I = styled(
  (p) =>
    <div {...p} />
  )`
    display: inline-block;
    color: gray;
    vertical-align: center;
    position: relative;
    top: -1px;
    font-size: 22px;
    margin-right: 2px;
  `

const PageTitle = styled(
  (p) =>
    <h2 className={p.className}>
      Daniel Reszka, 37
      <div>
        <small>Full-stack developer <br /><small>(RoR+React/Redux/nodeJS)</small></small>
      </div>
    </h2>
  )`
  font-weight: normal;
  text-align: center;
  line-height: 1.2;
  div {
    line-height: 1;
  }
  font-weight: normal;
  margin: 0 0 0.8em;
  small {
    color: gray;
  }
  `

const Intro = () =>
    <div style={{fontWeight: 'normal', textAlign: 'center', lineHeight: 1.4}}>
      <div>
        <div>I build APIs, responsive websites and web apps</div>
        <div>I'm fluent in React + Redux + Rails</div>
      </div>
    </div>

const Contents = styled(
  (p) =>
    <div className={p.className}>
      <Portrait />
      <PageTitle />
      <Intro />
      <div style={{textAlign: 'center'}}>
        <p className='pdf-text'>My CV</p>
        <div>
          <CvLink />
          <small className='mute'>
            ({moment('2017-03-27').format('MMM D, YYYY')})
          </small>
        </div>
        <hr />
      </div>
      <div className='list'>
        <p>You might also like to visit these pages</p>
        <div><I><IHome /></I>    <Link className='text-link' to='/'>Blog</Link></div>
        <div><I><ICode /></I>    <Link className='text-link' to='/dev/'>Programming & Design</Link></div>
        <div><I><IPicture /></I> <Link className='text-link' to='/gallery/'>Gallery</Link></div>
        <div><I><IAbout /></I>   <Link className='text-link' to='/about/'>About</Link></div>
      </div>
      </div>

  )`
    background: white;
    padding: 3em 0 4em;
    border-radius: 20px;
    .list {
      text-align: left;
      p {
        text-align: center;
        margin-bottom: 1em;
      }
      div {
        margin-left: calc(47% - 8em );
        margin-bottom: 3px;
      }
    }
    .pdf-text {
      margin: 2.5em 0 0.25em;
    }
    hr {
      margin: 3.5em 10%;
    }
  `

class CV extends React.Component {
  render () {
    return (
      <Contents />
    )
  }
}

export default CV
