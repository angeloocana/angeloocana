import React from 'react';
import PropTypes from 'proptypes';
import PostList from '../components/PostList';
import SocialLinks from '../components/SocialLinks';
import Welcome from '../components/Welcome';
import { getCurrentLangKey } from '../i18n/langs';
import Link from 'gatsby-link';
import styled from 'styled-components';

const Btn = styled(Link)`
  background-color: ${({theme}) => theme.colors.white};
  padding: 1rem;
  margin: ${({theme}) => theme.scale(2)} auto;
  color: ${({theme}) => theme.colors.black};
  border-radius: 0.2rem;
  text-decoration: none;
  display: table;
  font-weigth: bold;
`;

const getBtnMorePostsText = (currentLangKey) => {
  return {
    en: 'See more interesting posts >>',
    fr: `Voir d'autres messages intéressants >>`,
    pt: 'Ver mais posts interessantes >>'
  };
};

class Index extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    location: PropTypes.object
  }

  render() {
    const url = this.props.location.pathname;
    const currentLangKey = getCurrentLangKey(url);

    const posts = this.props.data.allMarkdownRemark.edges;

    return (
      <div>
        <SocialLinks />
        <Welcome currentLangKey={currentLangKey} />
        <PostList posts={posts} currentLangKey={currentLangKey} />
        <Btn to={`/${currentLangKey}/blog/`}>
          {getBtnMorePostsText()[currentLangKey]}
        </Btn>
      </div>
    );
  }
}

export default Index;
