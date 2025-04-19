const fs = require('fs-extra')
const path = require('path')

const sourceBuild = path.resolve(__dirname, '../../../front-back-server/dist')
const destination = path.resolve(__dirname, '../../front-back-server')

// Paso 1: Copiar build
fs.copy(sourceBuild, destination, { overwrite: true })
  .then(() => {
    console.log('✅ Backend exe copied.')
  }).catch((err) => {
    console.error('❌ Error in backend build process:', err)
    fs.remove(destination, (removeErr) => {
      if (removeErr) console.error('❌ Error cleaning up:', removeErr)
      else console.log('🧹 Cleaned up dist-backend due to error.')
    })
  })
