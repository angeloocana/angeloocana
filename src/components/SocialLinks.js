import React from 'react';
import GithubIcon from 'react-icons/lib/fa/github';
import YoutubeIcon from 'react-icons/lib/fa/youtube';
import FacebookIcon from 'react-icons/lib/fa/facebook-square';
import TwitterIcon from 'react-icons/lib/fa/twitter';
import PluralsightIcon from '../imgs/pluralsightIcon';
import styled from 'styled-components';

const Ul = styled.ul`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  margin: ${props => props.theme.socialLinks.margin};
  padding: ${props => props.theme.socialLinks.padding};
  list-style: none;
`;

const A = styled.a`
  color: ${props => props.theme.socialLinks.a.color};
  text-decoration: none;
  font-size: ${props => props.theme.socialLinks.a.fontSize};
  display: inline-block;
  margin: ${props => props.theme.socialLinks.a.margin};
  padding: ${props => props.theme.socialLinks.a.padding};
  transition: 0.3s;
  
  svg {
    font-size: ${props => props.theme.socialLinks.a.svg.fontSize};
    display: block;
    margin: ${props => props.theme.socialLinks.a.svg.margin};
    padding: ${props => props.theme.socialLinks.a.svg.padding};
  }

  &:hover {
    color: ${props => props.theme.socialLinks.a.hover.color};
    transition: 0.3s;
  }
`;

const SocialLinks = () => {
  return (
    <section>
      <Ul>
        <li>
          <A href="https://github.com/angeloocana" target="_blank">
            <GithubIcon />Github
          </A>
        </li>
        <li>
          <A href="https://pluralsight.com/profile/ocanaangelo" target="_blank">
            <PluralsightIcon />Pluralsight
          </A>
        </li>
        <li>
          <A href="https://youtube.com/ocanaangelo" target="_blank">
            <YoutubeIcon />Youtube
          </A>
        </li>
        <li>
          <A href="https://facebook.com/angeloocanadev" target="_blank">
            <FacebookIcon />Facebook
          </A>
        </li>
        <li>
          <A href="https://twitter.com/ocanaangelo" target="_blank">
            <TwitterIcon />Twitter
          </A>
        </li>
      </Ul>
    </section>
  );
};

export default SocialLinks;
