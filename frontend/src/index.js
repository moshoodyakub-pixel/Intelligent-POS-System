import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Initialize Sentry for error tracking (if configured)
if (process.env.REACT_APP_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.REACT_APP_ENVIRONMENT || 'development',
    release: process.env.REACT_APP_VERSION || '1.0.0',
    // Performance monitoring
    tracesSampleRate: parseFloat(process.env.REACT_APP_SENTRY_TRACES_SAMPLE_RATE || '1.0'),
    // Session replay for debugging
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Send web vitals to Sentry for performance monitoring
function sendToSentry(metric) {
  // Only send to Sentry if it's initialized
  if (process.env.REACT_APP_SENTRY_DSN) {
    Sentry.addBreadcrumb({
      category: 'web-vitals',
      message: `${metric.name}: ${metric.value}`,
      level: 'info',
      data: {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
      },
    });
  }
}

// Report web vitals for performance monitoring
reportWebVitals(sendToSentry);
