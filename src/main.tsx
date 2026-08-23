import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);

// Unit conversion is kept client-side and independent of the calculator engine.
document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  const button = target.closest('.calculate-button');
  const dialog = target.closest('[role="dialog"]');
  if (!button || !dialog || dialog.getAttribute('aria-label') !== 'Unit Converter') return;
  const value = Number((dialog.querySelector('input') as HTMLInputElement)?.value);
  const selects = [...dialog.querySelectorAll('select')] as HTMLSelectElement[];
  const result = dialog.querySelector('.result') as HTMLElement | null;
  if (!Number.isFinite(value) || selects.length < 3 || !result) return;
  const category = selects[0].value, from = selects[1].value, to = selects[2].value;
  let output = value;
  if (category === 'Temperature') {
    const c = from === 'Celsius' ? value : from === 'Fahrenheit' ? (value - 32) * 5 / 9 : value - 273.15;
    output = to === 'Celsius' ? c : to === 'Fahrenheit' ? c * 9 / 5 + 32 : c + 273.15;
  } else {
    const maps: Record<string, Record<string, number>> = {
      Length: {Meters:1, Kilometers:1000, Centimeters:.01, Millimeters:.001, Miles:1609.344, Feet:.3048, Inches:.0254},
      Weight: {Kilograms:1, Grams:.001, Milligrams:.000001, Pounds:.45359237, Ounces:.0283495231}
    };
    output = value * maps[category][from] / maps[category][to];
  }
  result.textContent = `${Number(output.toFixed(10)).toLocaleString('en-IN',{maximumFractionDigits:10})} ${to}`;
});
