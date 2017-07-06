import React from 'react';
import { rhythm } from 'utils/typography';

const Container = (props) =>
  <div style={{
    maxWidth: rhythm(28),
    padding: `${rhythm(1.5)} ${rhythm(3 / 4)}`,
    margin: 'auto',
  }}
  >
    {props.children}
  </div>;

Container.propTypes = {
  children: React.PropTypes.any,
};

class Template extends React.Component {
  render() {
    return (
      <Container
        style={{
          maxWidth: rhythm(28),
          padding: `${rhythm(1.5)} ${rhythm(3 / 4)}`,
        }}
      >
        {this.props.children}
      </Container>
    );
  }
}

Template.propTypes = {
  children: React.PropTypes.any,
};

export default Template;
