# COREBIQ Material Design System

A framework-free, reusable responsive component foundation for COREBIQ websites and ERP applications.

## Files
- css/corebiq-material.css — tokens, foundations, components, ERP patterns, desktop/mobile responsive rules
- js/corebiq-material.js — menu, dialog and drawer interactions
- demo/index.html — working component showcase

## Usage
Copy `css/corebiq-material.css` and `js/corebiq-material.js` into any COREBIQ project and include:

<link rel="stylesheet" href="/path/corebiq-material.css">
<script src="/path/corebiq-material.js"></script>

## Responsive
Desktop: full sidebar, multi-column grids.
Tablet: collapsible sidebar and reduced grids.
Mobile: single-column layout, horizontal-scroll tables, compact page spacing.

## Brand
The preset uses a COREBIQ blue + purple + subtle grey visual language. All major values are CSS variables under `:root`, so the complete theme can be changed centrally.

## Component naming
All classes use the `cb-` prefix to reduce collisions with application CSS.
