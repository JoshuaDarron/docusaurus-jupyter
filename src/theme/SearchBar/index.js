import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

export default function SearchBarWrapper() {
  return (
    <BrowserOnly>
      {() => {
        const SearchBar = require('./SearchBar').default;
        return <SearchBar />;
      }}
    </BrowserOnly>
  );
}
