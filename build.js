#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

console.log('🚀 Starting build process...');

try {
  // Step 1: Build the Vite app
  console.log('📦 Building Vite application...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Vite build completed');

  // Step 2: Build the Electron app
  console.log('⚡ Building Electron application...');
  execSync('npm run build:win', { stdio: 'inherit' });
  console.log('✅ Electron build completed');

  // Step 3: Create zip file
  console.log('📁 Creating zip file...');
  
  const distDir = path.join(__dirname, 'dist');
  const zipFile = path.join(__dirname, 'hotel-management-system.zip');
  
  // Remove existing zip file if it exists
  if (fs.existsSync(zipFile)) {
    fs.unlinkSync(zipFile);
  }

  const output = fs.createWriteStream(zipFile);
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  output.on('close', function() {
    console.log(`✅ Zip file created: ${archive.pointer()} total bytes`);
    console.log(`📦 Zip file location: ${zipFile}`);
  });

  archive.on('error', function(err) {
    throw err;
  });

  archive.pipe(output);

  // Add all files from dist directory
  archive.directory(distDir, false);

  archive.finalize();

  console.log('🎉 Build process completed successfully!');
  console.log('\n📋 Build outputs:');
  console.log('- Executable files: ./dist/');
  console.log('- Zip file: ./hotel-management-system.zip');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
