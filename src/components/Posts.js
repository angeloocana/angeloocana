import React from 'react';
import PropTypes from 'proptypes';
import Link from './Link';
import PostList from './PostList';
import BtnLink from './BtnLink';
import H2 from './H2';

const Posts = (props) => {
  const btnMorePosts = props.i18n.btnMorePostsMsg
    ? (<BtnLink to={`/${props.langKey}/blog/`}>
      {props.i18n.btnMorePostsMsg}
    </BtnLink>)
    : null;

  return (
    <section className="post-list">
      <header>
        <Link to={`/${props.langKey}/blog/`}>
          <H2>{props.i18n.title}</H2>
        </Link>
      </header>
      <PostList {...props} />
      {btnMorePosts}
    </section>
  );
};

Posts.propTypes = {
  posts: PropTypes.array.isRequired,
  langKey: PropTypes.string.isRequired,
  i18n: PropTypes.shape({
    btnMorePostsMsg: PropTypes.string,
    title: PropTypes.string.isRequired
  })
};

export default Posts;
