import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

export default function Root({ children }) {
  return (
    <>
      {children}
      <BrowserOnly>
        {() => {
          const Chatbot = require('@site/src/components/Chatbot').default;
          return <Chatbot />;
        }}
      </BrowserOnly>
    </>
  );
}
