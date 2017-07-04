import React from 'react'
import Footer from 'components/Footer'
import FaFlickr from 'react-icons/lib/fa/flickr'
import Lightbox from 'react-images'
import styled from 'styled-components'
import PageTitle from 'components/PageTitle'
import './lightbox-styles.css'

const Img = styled(
  (p) =>
    <img
      title={p.alt}
      className={p.className}
      {...p}
    />
  )`
    border-radius: 10px;
    cursor: pointer;
    margin-bottom: 20px;
    display: block;
    position: relative;
    top: 0;
    right: 0;
    border: 3px solid #ddd;
    transition-duration: 0.2s;
    box-shadow: -2px 5px 10px rgba(0,0,0, 0.45);
    &:hover{
      box-shadow: -2px 10px 25px rgba(0,0,0, 0.45);
      top: -1px;
      right: 0;
    }
  `

const images = [
  { src: 'octo.jpg'                , alt: 'Drawing: Meet my friend Octopus'   },
  { src: 'turtles.jpg'             , alt: 'Drawing: Flying Turtle'            },
  { src: 'pure energy.jpg'         , alt: 'Drawing: Pure Energy'              },
  { src: 'bloom.png'               , alt: 'Drawing: Krita space flower'       },
  { src: 'insect-communication.jpg', alt: 'Photo: Insects communication macro'},
  { src: 'daydreaming.jpg'         , alt: 'Drawing: Daydreaming'              },
  { src: 'dead.jpg'                , alt: 'Drawing: Dead Lady'                },
  { src: 'insect-activity.jpg'     , alt: 'Drawing: Insects activity'         },
  { src: 'insect-autobahn.jpg'     , alt: 'Drawing: Insects autobahn'         },
  { src: 'texture-2.jpg'           , alt: 'Photo: Natural texture 1'          },
  { src: 'texture-corn.jpg'        , alt: 'Photo: Natural texture 2'          },
]

const LightboxTheme = {
  close: {
    opacity: 0,
    height: 35,
    transitionDuration: '0.5s',
    ':hover': {
      opacity: 0.8,
    },
  },
  arrow__size__medium: {
    height: 40,
    marginTop: 0,
  },
  arrow: {
    opacity: 0.3,
    width: 10,
    transitionDuration: '0.5s',
    ':hover': {
      opacity: 0.8,
    },
  },
  container: {
    background: 'rgba(31, 26, 16, 1)',
  },
  image: {
    borderRadius: 100,
  },
  footerCount: {
    opacity: 0,
  }
}


const FlickrLink = styled(
  (p) =>
    <p className={p.className}>
      {' '}
      <a
        href='https://www.flickr.com/photos/pixarea/albums'
        target='_blank'
      >
        <FaFlickr style={{ fontSize: '130%', color: '#555', position: 'relative', top: -2, marginRight: '0.2em'}} />
        <span>
          More on Flickr
        </span>
      </a>
    </p>
  )`
    text-align: center;
    a {
      display: block;
      padding: 100px 0;
      margin: 10% 30%;
      background: white;
      transition-duration: 0.2s;
      box-shadow: -5px 5px 20px rgba(0,0,0, .25);
      &:hover{
        background: white;
        box-shadow: -30px 30px 25px rgba(0,0,0, .15);
      }
      border-radius: 10px;
      span {
       border-bottom: 1px dotted #ABDDFE;
        transition-duration: 0.2s;
      }
      &:hover span {
        // border-bottom: 1px solid ;
      }

    }
  `

class Gallery extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      lightbox: {
        isOpen: false,
        currentImage: 0,
      }
    }
  }

  render () {
    const openLightbox = (idx) =>
      this.setState({lightbox: {isOpen: true, currentImage: idx}})

    const closeLightbox = () =>
      this.setState({lightbox: {isOpen: false}})

    const gotoPrevLightboxImage = () =>
      this.setState({lightbox: {isOpen: true, currentImage: this.state.lightbox.currentImage - 1}})

    const gotoNextLightboxImage = () =>
      this.setState({lightbox: {isOpen: true, currentImage: this.state.lightbox.currentImage + 1}})

    return (
      <div>
        <PageTitle>Creations</PageTitle>

        <Lightbox
          images={images}
          isOpen={this.state.lightbox.isOpen}
          onClose={closeLightbox}
          currentImage={this.state.lightbox.currentImage}
          backdropClosesModal={true}
          theme={LightboxTheme}
          onClickPrev={gotoPrevLightboxImage}
          onClickNext={gotoNextLightboxImage}
        />

        {images.map((i, idx) =>
          <Img
            key={i.src}
            src={i.src}
            alt={i.alt}
            title={i.alt}
            onClick={() => openLightbox(idx)}
          />
        )}

        <FlickrLink />

        <Footer />
      </div>
    )
  }
}

export default Gallery
