import React from 'react'
import styled from 'styled-components'
import IPdf from 'react-icons/lib/fa/file-pdf-o'

const S = styled.span`
  display: inline-block;
  text-align: center;
  color: #f6f6f6;
  background: #DA0502;
  border-radius: 20%;
  padding: 0px 0 0px;
  line-height: 45px;
  margin-right: 0;
  font-size: 30px;
  transition-duration: 0.4s;
    &:hover {
      background: #FF0400;
      color: white;
    }
  a {
    display: block;
    color: inherit;
    padding: 0 10px 5px;
  }
  position: relative;
  transition-duration: 0.2s;
  top: 0;
  box-shadow: 0 0 0 rgba(0,0,0,0);
  &:hover {
    top: -5px;
    box-shadow: -0px 10px 10px rgba(0,0,0,0.2);
  }
`

const CvLink = () =>
  <div>
    <S>
      <a title="Daniel Reszka - Full-stack developer CV" href="/static/pdf/cv-full-stack-developer-2017-daniel-reszka.pdf">
        <IPdf />
      </a>
    </S>

  </div>


export default CvLink
