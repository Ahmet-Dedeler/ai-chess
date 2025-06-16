/**
 * Web Vitals Performance Measurement Module
 * 
 * This module provides functionality to measure and report Core Web Vitals metrics
 * which are important user-centric performance indicators for web applications.
 * 
 * Core Web Vitals measured:
 * - CLS (Cumulative Layout Shift): Visual stability
 * - FID (First Input Delay): Interactivity responsiveness
 * - FCP (First Contentful Paint): Loading performance
 * - LCP (Largest Contentful Paint): Loading performance
 * - TTFB (Time to First Byte): Server responsiveness
 */

import { ReportHandler } from 'web-vitals';

/**
 * Reports web vitals metrics if a valid handler function is provided
 * 
 * @param onPerfEntry - Optional callback function to handle performance metrics
 *                     Can be used to log metrics to console or send to analytics service
 */
const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  // Check if a valid performance entry handler is provided
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Dynamically import web-vitals library to avoid adding it to the main bundle
    // This keeps the initial bundle size smaller
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      // Measure and report each Core Web Vital metric
      getCLS(onPerfEntry);  // Cumulative Layout Shift
      getFID(onPerfEntry);  // First Input Delay
      getFCP(onPerfEntry);  // First Contentful Paint
      getLCP(onPerfEntry);  // Largest Contentful Paint
      getTTFB(onPerfEntry); // Time to First Byte
    });
  }
};

export default reportWebVitals;