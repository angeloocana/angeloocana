import React from 'react';
import graphql from 'graphql';
import PropTypes from 'proptypes';
import Helmet from 'react-helmet';
import PostList from '../components/PostList';
import SocialLinks from '../components/SocialLinks';

class BlogIndexRoute extends React.Component {
  static propTypes = {
    data: PropTypes.object
  }

  render() {
    const posts = this.props.data.allMarkdownRemark.edges;
    console.log('posts', posts);
    const { siteMetadata } = this.props.data.site;

    return (
      <div>
        <Helmet title={siteMetadata.title} />
        <SocialLinks />
        <section className="welcome">
          <p>
            Good morning! Welcome to my site, where you can learn about quality software development and hire my services.
                I wish you accept my challenge: <mark>Study every day</mark>, at least 10 minutes.
                Are you ready to learn and change your life?
          </p>
        </section>
        <PostList posts={posts} />
      </div>
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
