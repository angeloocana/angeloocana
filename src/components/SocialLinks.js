import React from 'react';
import GithubIcon from 'react-icons/lib/fa/github';
import YoutubeIcon from 'react-icons/lib/fa/youtube';
import FacebookIcon from 'react-icons/lib/fa/facebook-square';
import TwitterIcon from 'react-icons/lib/fa/twitter';
import PluralsightIcon from '../imgs/pluralsightIcon';
import styled from 'styled-components';

const A = styled.a`
  color: white;
  text-decoration: none;
  font-size: 1rem;

  svg {
    font-size: 3rem;
  }
`;

const SocialLinks = () => {
  return (
    <section>
      <nav>
        <ul>
          <li>
            <A href="github.com/angeloocana" target="_blank">
              <GithubIcon />Github
            </A>
          </li>
          <li>
            <A href="https://pluralsight.com/profile/ocanaangelo" target="_blank">
              <PluralsightIcon />Pluralsight
            </A>
          </li>
          <li>
            <A href="youtube.com/ocanaangelo" target="_blank">
              <YoutubeIcon />Youtube
            </A>
          </li>
          <li>
            <A href="https://github.com/angeloocana" target="_blank">
              <FacebookIcon />Facebook
            </A>
          </li>
          <li>
            <A href="https://github.com/angeloocana" target="_blank">
              <TwitterIcon />Twitter
            </A>
          </li>          
        </ul>
      </nav>
    </section>
  );
};

export default SocialLinks;
