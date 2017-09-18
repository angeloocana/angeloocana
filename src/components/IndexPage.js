import React from 'react';
import PropTypes from 'prop-types';
import Posts from './Posts';
import SocialLinks from './SocialLinks';
import Welcome from './Welcome';
import BtnLink from './BtnLink';
import Technologies from './Resume/Technologies';
import { take } from 'ramda';
import { FormattedMessage } from 'react-intl';

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
      />
      <FormattedMessage id="resume.technologies.seeMore">
        {(txt) => (
          <BtnLink to={`/${langKey}/resume/`}>
            {txt}
          </BtnLink>
        )}
      </FormattedMessage>
      <Posts
        posts={posts}
        langKey={langKey}
        showBtnMorePosts
      />
    </div>
  );
};

Index.propTypes = {
  data: PropTypes.object.isRequired,
  pathContext: PropTypes.object.isRequired
};

export default Index;
