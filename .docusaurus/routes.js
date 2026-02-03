import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/docs',
    component: ComponentCreator('/docs', '2fb'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', '6b4'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', '333'),
            routes: [
              {
                path: '/docs/intro',
                component: ComponentCreator('/docs/intro', '61d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/notebooks/notebooks/data-exploration',
                component: ComponentCreator('/docs/notebooks/notebooks/data-exploration', 'cee'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/notebooks/notebooks/pipeline-basics',
                component: ComponentCreator('/docs/notebooks/notebooks/pipeline-basics', 'c86'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/notebooks/notebooks/pipeline-results',
                component: ComponentCreator('/docs/notebooks/notebooks/pipeline-results', '9eb'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', '2e1'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
