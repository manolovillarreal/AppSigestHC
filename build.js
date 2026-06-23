import fs from 'fs';
import path from 'path';

const filesToCopy = [
  'admin.html',
  'index.html',
  'login.html'
];

const dirsToCopy = [
  'css',
  'img',
  'src'
];

const distDir = path.resolve('dist');

// Clean dist folder or create it
if (fs.existsSync(distDir)) {
  console.log('Cleaning existing dist directory...');
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy files
for (const file of filesToCopy) {
  const srcPath = path.resolve(file);
  const destPath = path.join(distDir, file);
  if (fs.existsSync(srcPath)) {
    console.log(`Copying ${file} -> dist/${file}`);
    fs.copyFileSync(srcPath, destPath);
  } else {
    console.warn(`Warning: File ${file} not found.`);
  }
}

// Copy directories
for (const dir of dirsToCopy) {
  const srcPath = path.resolve(dir);
  const destPath = path.join(distDir, dir);
  if (fs.existsSync(srcPath)) {
    console.log(`Copying directory ${dir} -> dist/${dir}`);
    fs.cpSync(srcPath, destPath, { recursive: true });
  } else {
    console.warn(`Warning: Directory ${dir} not found.`);
  }
}

console.log('Build completed successfully!');
