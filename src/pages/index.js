import React from 'react';
import graphql from 'graphql';
import PropTypes from 'proptypes';
import Helmet from 'react-helmet';
import PostList from '../components/PostList';
import SocialLinks from '../components/SocialLinks';
import Welcome from '../components/Welcome';
import { ThemeProvider } from 'styled-components';
import theme from '../themes/theme';

class BlogIndexRoute extends React.Component {
  static propTypes = {
    data: PropTypes.object
  }

  render() {
    const posts = this.props.data.allMarkdownRemark.edges;
    console.log('posts', posts);
    const { siteMetadata } = this.props.data.site;

    return (
      <ThemeProvider theme={theme}>
        <div>
          <Helmet title={siteMetadata.title} />
          <SocialLinks />
          <Welcome />
          <PostList posts={posts} />
        </div>
      </ThemeProvider>
    );
  }
}

export default BlogIndexRoute;

export const pageQuery = graphql`
  query IndexQuery {
    site {
      siteMetadata {
        title
        author {
          homeCity,
          name
        }        
      }
    }
    allMarkdownRemark(
      limit: 2000
      sort: { fields: [frontmatter___date], order: DESC }
      filter: { frontmatter: { draft: { ne: true } } }
    ) {
      edges {
        node{
          frontmatter{
            title,
            tags,
            date,
            path
          },
          fields{
            slug,
            tagSlugs
          },
          excerpt 
        }
      }
    }
  }
`;
