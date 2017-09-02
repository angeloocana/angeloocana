import React from 'react';
import PropTypes from 'proptypes';
import Posts from './Posts';
import SocialLinks from './SocialLinks';
import Welcome from './Welcome';
import BtnLink from './BtnLink';
import Technologies from './Resume/Technologies';
import {take} from 'ramda';

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
      <BtnLink to={`/${langKey}/resume/`}>
        {props.btnResumeMsg}
      </BtnLink>
      <Posts posts={posts} currentLangKey={langKey} />
      <BtnLink to={`/${langKey}/blog/`}>
        {props.btnMorePostsMsg}
      </BtnLink>
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
