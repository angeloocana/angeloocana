import React from 'react';
import PropTypes from 'proptypes';
import graphql from 'graphql';
import PostList from '../components/PostList';
import SocialLinks from '../components/SocialLinks';
import Welcome from '../components/Welcome';
import { getCurrentLangKey } from '../i18n/langs';

class En extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    location: PropTypes.object
  }

  render() {
    const url = this.props.location.pathname;
    const currentLangKey = getCurrentLangKey(url);

    const posts = this.props.data.allMarkdownRemark.edges;

    return (
      <div>
        <SocialLinks />
        <Welcome currentLangKey={currentLangKey} />
        <PostList posts={posts} currentLangKey={currentLangKey} />
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
        fields: { langKey: { regex: "/(en|any)/" } } 
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
