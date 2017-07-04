import React from 'react'
import { Link } from 'react-router'
import { config } from 'config'
import { rhythm } from 'utils/typography'
import { prefixLink } from 'gatsby-helpers'
import IHeart from 'react-icons/lib/ti/heart'

class Bio extends React.Component {
  render () {
    return (
      <div
        style={{
          marginBottom: rhythm(2.5),
        }}
      >
        <img
          src={prefixLink('/static/img/profile-pic-60x60.jpg')}
          alt={`author ${config.authorName}`}
          width={60}
          height={60}
          style={{
            float: 'left',
            marginRight: rhythm(1/4),
            marginTop: -5,
            marginBottom: 0,
            borderRadius: '100%',
            border: '4px solid #f6f6f6',
            boxSizing: 'content-box',
          }}
        />
        <div
          style={{ marginLeft: 80}}
        >
          Crafted with <IHeart style={{ position: 'relative', top: -2, color: 'gray'}} />  by <strong>{config.authorName}</strong> who lives and works in Berlin building useful things.
          {' '}
          <Link className='text-link' to='/about/'>You should follow him on social media</Link>.
        </div>
      </div>
    )
  }
}

export default Bio
