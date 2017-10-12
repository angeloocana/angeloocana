import React from 'react';
import Index from '../components/IndexPage';
import graphql from 'graphql';
import { redirectToHome } from 'ptz-i18n';

class RedirectIndex extends React.PureComponent {
  constructor(args) {
    super(args);
    const { langs, defaultLangKey } = args.data.site.siteMetadata.languages;
    redirectToHome(langs, defaultLangKey);
  }

  render() {
    return (<Index {...this.props} />);
  }
}

RedirectIndex.propTypes = {

};

export default RedirectIndex;

export const pageQuery = graphql`
  query IndexQuery {
    allMarkdownRemark(
      limit: 3
      sort: { fields: [frontmatter___date], order: DESC }
      filter: {
        frontmatter: { draft: { ne: true } },
        fields: { langKey: { regex: "/(en|any)/" } }
      },
    ) {
      edges {
        node{
          frontmatter{
            title,
            date
          },
          fields{
            slug,
            langKey
          },
          excerpt
        }
      }
    }
    site{
      siteMetadata{
        languages {
          defaultLangKey
          langs
        }
        resume{
          technologies{
            name,
            tags,
            level,
            years,
            img
          }
        }
      }
    }
  }
`;
