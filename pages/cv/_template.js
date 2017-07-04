import React from 'react'
import access from 'safe-access'
import include from 'underscore.string/include'
import { Link as _Link } from 'react-router'
// import { Container } from 'react-responsive-grid'
import { prefixLink } from 'gatsby-helpers'
import { rhythm, scale } from 'utils/typography'
import { config } from 'config'
import styled from 'styled-components'

const Container = (props) =>
  <div style={{
      maxWidth: rhythm(28),
      padding: `${rhythm(1.5)} ${rhythm(3/4)}`,
      margin: 'auto',
    }}
  >
    {props.children}
  </div>

class Template extends React.Component {
  render () {
    return (
      <Container
        style={{
          maxWidth: rhythm(28),
          padding: `${rhythm(1.5)} ${rhythm(3/4)}`,
        }}
      >
        {this.props.children}
      </Container>
    )
  }
}

Template.propTypes = {
  children: React.PropTypes.any,
}

export default Template
