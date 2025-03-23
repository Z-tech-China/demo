// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
//export { default as ModelLoader } from './components/ModelLoader';
export { default as App } from './App.jsx';
// src/index.js
//export { default as YourMainComponent } from './components/YourMainComponent';
// 导出需要公开的所有组件、函数等
//export { rollUpShadingNet, expandShadingNet } from './App.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
