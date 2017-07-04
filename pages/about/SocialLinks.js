import React from 'react'
import styled from 'styled-components'
import FaGithub from 'react-icons/lib/fa/github'
import FaFacebook from 'react-icons/lib/fa/facebook'
import FaTwitter from 'react-icons/lib/fa/twitter'
import FaLinkedin from 'react-icons/lib/fa/linkedin'
import FaFlickr from 'react-icons/lib/fa/flickr'
import MdInfo from 'react-icons/lib/md/info'

const S = styled.span`
  @media screen and (min-width: 480px) {
    position: relative;
    left: -29px;
  }
  margin-top: 20px;
  display: inline-block;
  text-align: center;
  color: #f6f6f6;
  background: #999;
  border-radius: 20%;
  padding: 5px 10px 8px;
  line-height: 45px;
  width: 60px;
  margin-right: 15px;
  font-size: 40px;
  transition-duration: 0.4s;
    &:hover {
      background: #5790C4;
      color: white;
    }
  a {
    color: inherit;
  }
  position: relative;
  transition-duration: 0.2s;
  top: 0;
  box-shadow: 0 0 0 rgba(0,0,0,0);
  &:hover {
    top: -5px;
    box-shadow: -0px 10px 10px rgba(0,0,0,0.2);
  }
`

const SocialLinks = () =>
  <div>
    <S>
      <a title="github.com/danielres" href="https://www.github.com/danielres" target="_blank" rel="external">
        <FaGithub />
      </a>
    </S>

    <S>
      <a title="twitter.com/pixarea" href="https://twitter.com/pixarea" target="_blank" rel="external">
        <FaTwitter />
      </a>
    </S>

    <S>
      <a title="linkedin.com/in/danielres" href="https://be.linkedin.com/in/danielres" target="_blank" rel="external">
        <FaLinkedin />
      </a>
    </S>

    <S>
      <a title="flickr.com/photos/pixarea" href="https://www.flickr.com/photos/pixarea/albums" target="_blank" rel="external">
        <FaFlickr />
      </a>
    </S>

    <S>
      <a title="facebook.com/daniel.reszka.58" href="https://www.facebook.com/daniel.reszka.58" target="_blank" rel="external">
        <FaFacebook />
      </a>
    </S>

    {false &&
      <S>
        <a title="about.me/daniel.r" href="https://about.me/daniel.r" target="_blank" rel="external">
          <MdInfo />
        </a>
      </S>
    }
  </div>


export default SocialLinks
