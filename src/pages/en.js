import React from 'react';
import graphql from 'graphql';
import PropTypes from 'proptypes';
import PostList from '../blog/components/PostList';
import SocialLinks from '../core/components/SocialLinks';
import Welcome from '../core/components/Welcome';

class En extends React.Component {
  static propTypes = {
    data: PropTypes.object
  }

  render() {
    const posts = this.props.data.allMarkdownRemark.edges;
    return (
      <div>
        <SocialLinks />
        <Welcome />
        <PostList posts={posts} />
      </div>
    );
  }
}

export default En;

export const pageQuery = graphql`
  query EnQuery {
   allMarkdownRemark(
      limit: 2000
      sort: { fields: [frontmatter___date], order: DESC }
      filter: { 
        frontmatter: { draft: { ne: true } }, 
        fields: { langKey: { eq: "en" } } 
      },
    ) {
      edges {
        node{
          frontmatter{
            title,
            tags,
            date
          },
          fields{
            slug,
            tagSlugs,
            path
          },
          excerpt 
        }
      }
    }
  }
`;
