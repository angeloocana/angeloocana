import React from 'react';
import PropTypes from 'proptypes';
import PostList from '../components/PostList';
import SocialLinks from '../components/SocialLinks';
import Welcome from '../components/Welcome';
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

const Index = ({data, pathContext}) => {
  const posts = data.allMarkdownRemark.edges;
  const {langKey} = pathContext;

  return (
    <div>
      <SocialLinks />
      <Welcome currentLangKey={langKey} />
      <PostList posts={posts} currentLangKey={langKey} />
      <Btn to={`/${langKey}/blog/`}>
        {getBtnMorePostsText()[langKey]}
      </Btn>
    </div>
  );
};

Index.propTypes = {
  data: PropTypes.object,
  pathContext: PropTypes.object
};

export default Index;
