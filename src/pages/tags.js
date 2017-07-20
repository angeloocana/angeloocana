import React from 'react';
import PropTypes from 'proptypes';
import graphql from 'graphql';
import Helmet from 'react-helmet';
import Link from '../components/Link';
import kebabCase from 'lodash/kebabCase';

class TagsPageRoute extends React.Component {
  static propTypes = {
    data: PropTypes.object
  }

  render() {
    const title = this.props.data.site.siteMetadata.title;
    const allTags = this.props.data.allMarkdownRemark.group;

    return (
      <div>
        <Helmet title={title} />
        <div>
          <h1>Tags</h1>
          <ul>
            {allTags.map(tag =>
              <li key={tag.fieldValue}>
                <Link
                  style={{
                    textDecoration: 'none',
                  }}
                  to={`/tags/${kebabCase(tag.fieldValue)}/`}
                >
                  {tag.fieldValue} ({tag.totalCount})
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    );
  }
}

export default TagsPageRoute;

export const pageQuery = graphql`
  query TagsQuery {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(
      limit: 2000
      filter: { frontmatter: { draft: { ne: true } } }
    ) {
      group(field: frontmatter___tags) {
        fieldValue
        totalCount
      }
    }
  }
`;
