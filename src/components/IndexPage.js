import React from 'react';
import PropTypes from 'prop-types';
import Posts from './Posts';
import SocialLinks from './SocialLinks';
import Welcome from './Welcome';
import BtnLink from './BtnLink';
import Technologies from './Resume/Technologies';
import Games from './Resume/Games';
import { FormattedMessage } from 'react-intl';

const Index = (props) => {
  const posts = props.data.allMarkdownRemark.edges.map(p => p.node);
  const { langKey } = props.pathContext;
  const { pinnedTechnologies, games } = props.data.site.siteMetadata.resume;

  return (
    <div>
      <SocialLinks />
      <Welcome currentLangKey={langKey} />
      <Technologies
        technologies={pinnedTechnologies}
      />
      <FormattedMessage id="resume.technologies.seeMore">
        {(txt) => (
          <BtnLink to={`/${langKey}/resume/`}>
            {txt}
          </BtnLink>
        )}
      </FormattedMessage>
      <Games games={games} />
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
