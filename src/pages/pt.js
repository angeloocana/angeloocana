import graphql from 'graphql';
import Index from './index';

// const Pt = (props) => {
//   console.log('props', props);
//   return (
//     <div>pt</div>
//   );
// };

export default Index;

export const pageQuery = graphql`
  query PtIndexQuery {
    site {
      siteMetadata {
        title
        author {
          homeCity,
          name
        }        
      }
    }
    allMarkdownRemark(
      limit: 2000
      sort: { fields: [frontmatter___date], order: DESC }
      filter: { frontmatter: { draft: { ne: true } } }
    ) {
      edges {
        node{
          frontmatter{
            title,
            tags,
            date,
            path
          },
          fields{
            slug,
            tagSlugs
          },
          excerpt 
        }
      }
    }
  }
`;
