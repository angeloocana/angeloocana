import React from 'react';
import A from '../A';
import { FormattedMessage } from 'react-intl';
import PdfIcon from 'react-icons/lib/md/picture-as-pdf';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: inline-block;
  float: right;
  padding: 0 0 0 0;
  font-size: ${({ theme }) => theme.scale(0)};

  svg {
    padding: 0 ${({ theme }) => theme.scale(-10)} 0 0;
    font-size: ${({ theme }) => theme.scale(1)};
    margin-top: -${({ theme }) => theme.scale(-6)};
  }
`;

const ResumeDownloadPDF = () => {
  return (
    <Wrapper>
      <FormattedMessage id="resume.downloadPdf">
        {(txt) => (
          <A href="https://github.com/angeloocana/angeloocana/raw/master/static/AngeloOcanaMartins_en.pdf">
            <PdfIcon />
            {txt}
          </A>
        )}
      </FormattedMessage>
    </Wrapper>
  );
};

export default ResumeDownloadPDF;
