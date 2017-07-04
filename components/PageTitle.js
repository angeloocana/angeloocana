import React from 'react'
import { Link } from 'react-router'
import styled from 'styled-components'
import _O from './Ornament'
import IBack from 'react-icons/lib/fa/hand-o-left'

const O = () =>
  <_O width={71} height={20} style={{marginRight: 0}} color='#aaa'  />


const HMirror = styled.span`
  display: inline-block;
  -moz-transform: scaleX(-1);
  -o-transform: scaleX(-1);
  -webkit-transform: scaleX(-1);
  transform: scaleX(-1);
  filter: FlipH;
  -ms-filter: "FlipH";
`
const Back = styled.div`
  width: 200px;
  margin-left: -100px;
  margin-top: -42px;
  height: 70px;
  position: absolute;
  left: 50%;
  .icon{
    transition-duration: 0.2s;
    color: #666;
    margin-left: 10px;
    position: absolute;
    top: 0;
    opacity: 0;
  }
  &:hover .icon {
    opacity: 1;
    margin-left: -15px;
  }
`

const Title = (props) =>
  <div>
    <h3 className={props.className}>
      <div className='extra1'></div>
      <O />
      {props.children}
      <HMirror><O /></HMirror>
      { props.link &&
        <Link to={props.link}>
          <Back><IBack className='icon' /></Back>
        </Link>
      }
    </h3>
  </div>


export default styled(Title)`
  font-weight: 100;
  text-align: center;
  margin: 0 0 20px;
  color: gray;
  font-size: 100%;
  position: relative;
  z-index: 2;
  .extra1 {
    background: white;
    position: absolute;
    width: 100px;
    margin-left: -50px;
    margin-top: 11px;
    height: 0px;
    overflow: hidden;
    z-index: -1;
    left: 50%;
    border-radius: 100%;
    box-shadow: 0 0 51px 5px white;
  }
`
