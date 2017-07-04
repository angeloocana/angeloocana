import React from 'react'
import { rhythm } from 'utils/typography'
import Bio from './Bio'

export default (props) =>
  <div
    style={{
      marginBottom: rhythm(2.5),
      borderTop: '1px dashed #ccc',
      paddingTop: 30,
    }}
  >
    <Bio />
  </div>


