import graphql from 'graphql';
import Index from './index';

export default Index;

export const pageQuery = graphql`
  query FrIndexQuery {
    allMarkdownRemark(
      limit: 2000
      sort: { fields: [frontmatter___date], order: DESC }
      filter: { 
        frontmatter: { draft: { ne: true } }, 
        fields: { langKey: { eq: "fr" } } 
      },
    ) {
      edges {
        node{
          frontmatter{
            title,
            tags,
            date
          },
          fields{
            slug,
            tagSlugs,
            path
          },
          excerpt 
        }
      }
    }
  }
`;
