/* Fontes empacotadas no app: nada é buscado na internet. */
import '@fontsource/baloo-2/latin-600.css';
import '@fontsource/baloo-2/latin-700.css';
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/source-sans-3/latin-400.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import Portao from './Portao.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Portao />
  </React.StrictMode>
);
