import React from 'react'
import moment from 'moment'
import { Link } from 'react-router'
import sortBy from 'lodash/sortBy'
import { prefixLink } from 'gatsby-helpers'
import { rhythm } from 'utils/typography'
import Helmet from "react-helmet"
import access from 'safe-access'
import styled from 'styled-components'
import { config } from 'config'
import include from 'underscore.string/include'
import Footer from 'components/Footer'
import PageTitle from 'components/PageTitle'

const LinkIf = (props) =>
  props.if
  ? <Link to={props.to}>{props.children}</Link>
  : <span>{props.children}</span>

const _Entry = (props) => {
  return <div className={props.className}>
    <LinkIf
      if={!props.page.data.noLink}
      to={prefixLink(props.page.path)}
    >
      <div>
        <small className='mute'>
          {moment(props.page.data.date).format('MMMM D, YYYY')}
        </small>
      </div>
      <h3>{props.title}</h3>
      <div className='sep' />
      {<div className='sub'><small>{props.sub || ' . '}</small></div>}
      {props.preview &&
        <div
          className='preview'
        >
          <img
            width={props.preview.match(/-(\d+)x(\d+)\./)[1]}
            style={{borderRadius: 7, border: '2px solid #ddd', margin: '10px 0 0'}}
            src={prefixLink(props.page.path) + props.preview}
            alt='Article preview'
          />
        </div>
      }
      {props.page.data.noLink && <div dangerouslySetInnerHTML={{ __html: props.page.data.body }} />}
    </LinkIf>
  </div>
}

const Entry = styled(_Entry)`
  margin: 0 0 3px;
  padding: 30px;
  ${props => props.isFirst && 'border-radius: 10px 10px 0 0;' }
  ${props => props.isLast  && 'border-radius: 0 0  10px 10px;' }
  text-align: center;
  background: #f8f8f8;
  transition-duration: 0.4s;
  &:hover {
    background: white;
  }
  a .sep {
    width: 0%;
    transition-duration: 0.5s;
    margin: auto;
    opacity: 0.5;
    // http://www.colorzilla.com/gradient-editor/#aaaaaa+0,aaaaaa+50,aaaaaa+100&0+0,1+25,1+50,1+75,0+100
    background: -webkit-linear-gradient(left, rgba(170,170,170,0) 0%,rgba(170,170,170,1) 25%,rgba(170,170,170,1) 50%,rgba(170,170,170,1) 75%,rgba(170,170,170,0) 100%);    height: 1px;
  }
  &:hover a .sep {
    transition-duration: 0.4s;
    opacity: 1;
    width: 90%;
  }
  h3 {
    font-weight: 100;
    margin: 0;
  }
  .sub {
    color: gray
  }
`

class BlogIndex extends React.Component {
  render () {
    // Sort pages.
    const sortedPages = sortBy(this.props.route.pages, (page) =>
      access(page, 'data.date')
    ).reverse()
    const posts = sortedPages.filter((page) => access(page, 'file.ext') === 'md' && !include(page.path, '/404') && !include(page.path, '_drafts'))
    const entries = posts.map((page, idx) => {
      const title = access(page, 'data.title') || page.path
      const sub = access(page, 'data.sub') || ''
      const preview = access(page, 'data.preview')
      const isFirst = idx === 0 ? true : false
      const isLast = idx === posts.length - 1 ? true : false
      return <Entry
        key={title}
        title={title}
        sub={sub}
        page={page}
        isFirst={isFirst}
        isLast={isLast}
        preview={preview}
      />
    })
    return (
      <div>
        <Helmet
          title={config.blogTitle}
          meta={[
            {"name": "description", "content": "A blog about programming for the web, and various interesting things."},
            {"name": "keywords", "content": "blog, articles, programming, drawing, frontend, backend"},
          ]}
        />

        <PageTitle>Articles</PageTitle>

        <div style={{marginBottom: 40}}>
          {entries}
        </div>


        <Footer />
      </div>
    )
  }
}

BlogIndex.propTypes = {
  route: React.PropTypes.object,
}

export default BlogIndex
