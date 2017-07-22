import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.section`
  margin-top: ${props => props.theme.welcome.marginTop};
  margin-bottom: ${props => props.theme.welcome.marginBottom};

  p{
    font-size: ${props => props.theme.p.fontSize};
    line-height: ${props => props.theme.p.lineHeight};
  }

  p:first-of-type::first-letter {
      font-size: ${props => props.theme.p.firstLetter.fontSize};
      color: ${props => props.theme.p.firstLetter.color};
      float: left;
      line-height: ${props => props.theme.p.firstLetter.lineHeight};
      padding-top: ${props => props.theme.p.firstLetter.paddingTop};
  }
`;

const Welcome = () => {
  return (
    <Wrapper>
      <p>
        Hi!!! Welcome to my site, where you can learn about quality software development and hire my services.
        I wish you accept my challenge: <mark>Study every day</mark>, at least 10 minutes. <br />
        Are you ready to learn and change your life?
      </p>
    </Wrapper>
  );
};

export default Welcome;
