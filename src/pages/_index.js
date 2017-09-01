import React from 'react';
import PropTypes from 'proptypes';
import Posts from '../components/Posts';
import SocialLinks from '../components/SocialLinks';
import Welcome from '../components/Welcome';
import Link from 'gatsby-link';
import styled from 'styled-components';
import Technologies from '../components/Technologies';
import {take} from 'ramda';

const Btn = styled(Link)`
  background-color: ${({theme}) => theme.colors.white};
  padding: 1rem;
  margin: ${({theme}) => theme.scale(2)} auto;
  color: ${({theme}) => theme.colors.black};
  border-radius: 0.2rem;
  text-decoration: none;
  display: table;
  transition: 0.3s;

  &:hover {
    background-color: ${props => props.theme.colors.blackShades[0]};
    color: ${({theme}) => theme.colors.yellow};
    transition: 0.3s;
  }
`;

const Index = (props) => {
  const posts = props.data.allMarkdownRemark.edges;
  const {langKey} = props.pathContext;
  const technologies = take(6, props.data.site.siteMetadata.resume.technologies);

  return (
    <div>
      <SocialLinks />
      <Welcome currentLangKey={langKey} />
      <Technologies
        technologies={technologies}
        yearsMsg={props.yearsMsg}
        getLevelMsg={props.getLevelMsg}
        title={props.technologiesTitle}
      />
      <Btn to={`/${langKey}/resume/`}>
        {props.btnResumeMsg}
      </Btn>
      <Posts posts={posts} currentLangKey={langKey} />
      <Btn to={`/${langKey}/blog/`}>
        {props.btnMorePostsMsg}
      </Btn>
    </div>
  );
};

Index.propTypes = {
  data: PropTypes.object.isRequired,
  pathContext: PropTypes.object.isRequired,
  yearsMsg: PropTypes.string.isRequired,
  getLevelMsg: PropTypes.func.isRequired,
  btnResumeMsg: PropTypes.string.isRequired,
  btnMorePostsMsg: PropTypes.string.isRequired,
  technologiesTitle: PropTypes.string.isRequired
};

export default Index;
