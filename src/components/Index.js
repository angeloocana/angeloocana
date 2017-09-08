import React from 'react';
import PropTypes from 'proptypes';
import Posts from './Posts';
import SocialLinks from './SocialLinks';
import Welcome from './Welcome';
import BtnLink from './BtnLink';
import Technologies from './Resume/Technologies';
import { take } from 'ramda';

const Index = (props) => {
  const posts = props.data.allMarkdownRemark.edges.map(p => p.node);
  const { langKey } = props.pathContext;
  const technologies = take(6, props.data.site.siteMetadata.resume.technologies);

  return (
    <div>
      <SocialLinks />
      <Welcome currentLangKey={langKey} />
      <Technologies
        technologies={technologies}
        i18n={props.i18n.technologies}
      />
      <BtnLink to={`/${langKey}/resume/`}>
        {props.i18n.btnResumeMsg}
      </BtnLink>
      <Posts
        posts={posts}
        i18n={props.i18n.posts}
        langKey={langKey}
      />
    </div>
  );
};

Index.propTypes = {
  data: PropTypes.object.isRequired,
  pathContext: PropTypes.object.isRequired,
  i18n: PropTypes.shape({
    technologies: PropTypes.object.isRequired,
    btnResumeMsg: PropTypes.string.isRequired,
    posts: PropTypes.object.isRequired
  })
};

export default Index;
