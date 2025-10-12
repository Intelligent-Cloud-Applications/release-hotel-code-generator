import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Building without code signing...');

try {
  // Build the Vite app first
  console.log('📦 Building Vite app...');
  execSync('npm run build', { stdio: 'inherit' });

  // Create a minimal build config with no code signing
  const buildConfig = {
    "appId": "com.hotelmanagement.app",
    "productName": "Hotel Management System",
    "directories": {
      "output": "dist"
    },
    "files": [
      "out/**/*",
      "src/electron/**/*",
      "node_modules/**/*"
    ],
    "asarUnpack": [
      "node_modules/better-sqlite3/**/*"
    ],
    "extraResources": [
      {
        "from": "src/components/logo/logo.png",
        "to": "logo.png"
      }
    ],
    "win": {
      "target": [
        {
          "target": "portable",
          "arch": ["x64"]
        }
      ],
      "icon": "public/logo.ico",
      "requestedExecutionLevel": "asInvoker",
      "forceCodeSigning": false
    }
  };
  
  // Write temporary config
  fs.writeFileSync('electron-builder-config.json', JSON.stringify(buildConfig, null, 2));
  
  console.log('🔨 Building Electron app...');
  execSync('npx electron-builder --config electron-builder-config.json --win --dir', { stdio: 'inherit' });
  
  // Clean up
  fs.unlinkSync('electron-builder-config.json');
  
  console.log('✅ Build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
