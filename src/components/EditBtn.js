import React from 'react';
import PropTypes from 'proptypes';
import styled from 'styled-components';
import FaEdit from 'react-icons/lib/fa/edit';

const A = styled.a`
  display: block;
  text-align: center;
  padding: 1rem;
  color: ${({ theme }) => theme.colors.yellow};
  cursor: pointer;
  font-size: 1rem;
`;

const EditIcon = styled(FaEdit)`
  padding: 0 ${({ theme }) => theme.scale(-8)} 0 0;
`;

const getEditLink = (fileAbsolutePath) => {
  console.log('fileAbsolutePath', fileAbsolutePath);
  const path = fileAbsolutePath.split('/src/')[1];
  return `https://github.com/angeloocana/angeloocana/blob/master/src/${path}`;
};

const getLabel = () => {
  return {
    en: 'Edit',
    fr: 'Modifier',
    pt: 'Editar'
  };
};

const EditBtn = ({ fileAbsolutePath, currentLangKey }) => {
  return (
    <A href={getEditLink(fileAbsolutePath)} target="_blank">
      <EditIcon />
      {getLabel()[currentLangKey]}
    </A>
  );
};

EditBtn.propTypes = {
  fileAbsolutePath: PropTypes.string,
  currentLangKey: PropTypes.string
};

export default EditBtn;
