import React from 'react';
import GithubIcon from 'react-icons/lib/fa/github';
import YoutubeIcon from 'react-icons/lib/fa/youtube';
import FacebookIcon from 'react-icons/lib/fa/facebook-square';
import TwitterIcon from 'react-icons/lib/fa/twitter';
import PluralsightSvg from '../imgs/pluralsight.svg';

const SocialLinks = () => {
  return (
    <section>
      <nav>
        <ul>
          <li>
            <a href="github.com/angeloocana" target="_blank">
              <GithubIcon />Github
            </a>
          </li>
          <li>
            <a href="https://pluralsight.com/profile/ocanaangelo" target="_blank">
              <img src={PluralsightSvg} alt="Pluralsight" />Pluralsight
            </a>
          </li>
          <li>
            <a href="youtube.com/ocanaangelo" target="_blank">
              <YoutubeIcon />Youtube
            </a>
          </li>
          <li>
            <a href="https://github.com/angeloocana" target="_blank">
              <FacebookIcon />Facebook
            </a>
          </li>
          <li>
            <a href="https://github.com/angeloocana" target="_blank">
              <TwitterIcon />Twitter
            </a>
          </li>          
        </ul>
      </nav>
    </section>
  );
};

export default SocialLinks;
