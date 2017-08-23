import React from 'react';
import PropTypes from 'proptypes';
import PostList from '../components/PostList';
import { getCurrentLangKey } from '../i18n/langs';

class Blog extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    location: PropTypes.object
  }

  render() {
    const url = this.props.location.pathname;
    const currentLangKey = getCurrentLangKey(url);

    const posts = this.props.data.allMarkdownRemark.edges;

    return (
      <PostList posts={posts} currentLangKey={currentLangKey} />
    );
  }
}

export default Blog;
