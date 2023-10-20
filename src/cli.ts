const pkg = require('../package')

// const PACKAGE_FILE_NAME = 'package.json'
// const PACKAGE_LOCK_FILE_NAME = 'package-lick.json'

async function main() {
  console.log('Hello world!')
}

main().catch((err) => {
  setTimeout(() => {
    if (err.type === pkg.name) {
      process.exit(err.code)
    }

    throw err
  }, 0)
})
