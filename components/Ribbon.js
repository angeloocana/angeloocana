import React from 'react'
import styled from 'styled-components'
import {Link} from 'react-router'

// generated with http://livetools.uiparade.com/ribbon-builder.html
const Ribbon = styled(
  (p) =>
    <div className={p.className}>
      <div className="ribbon">
        <div className="ribbon-stitches-top"></div>
        <strong className="ribbon-content">
          <Link to={p.href}>Hire me</Link>
        </strong>
        <div className="ribbon-stitches-bottom"></div>
      </div>
    </div>
  )`
    .ribbon {
      font-size: 8px;
      display: inline-block;
      width: auto;
      position: relative;
      background: #F35454;
      background: linear-gradient(top, #FF4343, #B32A2A);
      box-shadow: rgba(20,000,000,0.2) 2px 5px 8px;
      transition: 0.4s ease-out;
      background-size: 1px 120px;
      background-position: 0 -60px;
      transition-duration: 0.3s;
      left: 0;
      top: 0;
      &:hover {
        box-shadow: rgba(255,240,240,0.8) 2px 5px 16px;
        background-position: 0 0;
        left: -3px;
        top: 3px;
        a {
          color: #FFEAEA;
          text-shadow: #FFB2B2 0 0 10px;
        }
      }
     }
    .ribbon a {
      transition-duration: 0.6s;
      display: block;
      font-size: 14px;
      line-height: 1;
      color: #700D0D;
      text-shadow: #FF9595 1px 1px 2px;
      margin: 0px;
      padding: 8px 100px;
     }
    .ribbon-stitches-top {
      margin-top: 1px;
      border-top: 1px dashed rgba(0, 0, 0, 0.2);
      -moz-box-shadow: 0px 0px 2px rgba(0, 0, 0, 0.5);
      -webkit-box-shadow: 0px 0px 2px rgba(0, 0, 0, 0.5);
      box-shadow: 0px 0px 2px rgba(255, 255, 255, 1);
     }
    .ribbon-stitches-bottom {
      margin-bottom: 1px;
      border-top: 1px dashed rgba(0, 0, 0, 0.2);
      -moz-box-shadow: 0px 0px 2px rgba(0, 0, 0, 0.3);
      -webkit-box-shadow: 0px 0px 2px rgba(0, 0, 0, 0.3);
      box-shadow: 0px 0px 2px rgba(255, 255, 255, 0.2);
     }
  `

export default class extends React.Component {
  render () {
    return (
      <Ribbon {...this.props} />
    )
  }
}
