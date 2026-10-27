import React from 'react';
import PropTypes from 'prop-types';
import ReactDisqusComments from 'react-disqus-comments';
import styled from 'styled-components';

class Comments extends React.PureComponent {
  static propTypes = {
    shortname: PropTypes.string,
    identifier: PropTypes.string,
    title: PropTypes.string,
    url: PropTypes.string,
    category_id: PropTypes.string
  }

  handleNewComment(comment) {
    console.log(comment.text);
  }

  render() {

    return (
      <ReactDisqusComments
        onNewComment={this.handleNewComment}
        {...this.props}
      />
    );
  }
}

export default styled(Comments)`
  margin: ${({theme}) => theme.scale(6)} 0;
`;
