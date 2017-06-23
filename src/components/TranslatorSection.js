import React from 'react';

const Section = ({ language }) => (
  <section className="TranslatorSection">
    <div className="container small-container">
      <OtherLanguages />
    </div>
  </section>
);

const OtherLanguages = () => (
  <div style={{ textAlign: 'center' }}>
    <p>
      This article is also available in <a href="/pt/">Portuguese</a>.
    </p>
    <p>
      <a href="/pt/">Português</a>pt
    </p>
  </div>
);

export default Section;
