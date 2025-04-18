const fs = require('fs-extra')
const path = require('path')
const { execSync } = require('child_process')

const sourceBuild = path.resolve(__dirname, '../../../front-back-server/build')
const sourcePkg = path.resolve(__dirname, '../../../front-back-server/package.json')
const sourceEnv = path.resolve(__dirname, '../../../front-back-server/.env')
const destination = path.resolve(__dirname, '../../front-back-server')

// Copiar archivo .env
fs.copyFile(sourceEnv, path.join(destination, '.env'))
  .then(() => {
    console.log('✅ .env file copied.')
  })
  .catch((err) => {
    console.error('❌ Error copying .env file:', err)
  })

// Paso 1: Copiar build
fs.copy(sourceBuild, destination, { overwrite: true })
  .then(() => {
    console.log('✅ Backend build copied.')

    // Paso 2: Copiar package.json
    return fs.copyFile(sourcePkg, path.join(destination, 'package.json'))
  })
  .then(() => {
    console.log('✅ package.json copied.')

    // Paso 3: Instalar dependencias backend (solo producción, sin scripts)
    console.log('📦 Installing backend dependencies...');
    execSync('npm install --omit=dev', {
      cwd: destination,
      stdio: 'inherit'
    });
    console.log('✅ Backend dependencies installed.')
  })
  .then(() => console.log('✅ Backend dependencies installed.'))
  .catch((err) => {
    console.error('❌ Error in backend build process:', err)
    fs.remove(destination, (removeErr) => {
      if (removeErr) console.error('❌ Error cleaning up:', removeErr)
      else console.log('🧹 Cleaned up dist-backend due to error.')
    })
  })
