import React from 'react';
import graphql from 'graphql';

class Test extends React.Component {
  render() {
    return (
      <div>
        A--B
      </div>
    );
  }
};

export default Test;

export const pageQuery = graphql`
    query TestQuery {
        site {
            siteMetadata {
                title
            }
        }
    }
`;
