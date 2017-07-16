import React from "react"

class Test extends React.Component {
  render() {
    console.log('test props', this.props)

    return (
      <div>
        -{this.props.data.site.siteMetadata.title}-
      </div>
    )
  }
}

export default Test

export const pageQuery = graphql`
  query Test {
    site {
      siteMetadata {
        title
      }
    }
  }
`
