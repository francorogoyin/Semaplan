# Build Instructions for Mozilla Add-ons Review
------------------------------------------------

## Supported operating systems
- macOS (Intel and Apple Silicon)  
- Linux (including Ubuntu 24.04 LTS ARM64 – the exact environment used by Mozilla reviewers)  
- Windows 10 / 11 (64-bit)

## Required tools and versions
- Node.js 20 or 22 (Mozilla reviewers use Node 22.11.0)  
- npm 9+ (bundled with Node.js)

Download: https://nodejs.org/en/download/

## Build steps

All required dependencies are declared in package.json and locked to exact versions via package-lock.json.  

In the root directory of the unpacked source archive, run:

# 1. Install exact dependency versions (mandatory for reproducibility)
npm i

# 2. Build the extension
npm run build