import App from './components/App';
import 'bootstrap/dist/css/bootstrap.css';
import configureStore from './store/configureStore';
import { configure } from '@testing-library/react';
import React, { Component } from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import { render } from 'react-dom';
import { Provider } from 'react-redux';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={configureStore()}>
      <App />
    </Provider>,
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
