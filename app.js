import express from 'express'
import mustache from "mustache-express"
import router from './router.js'

// INIT
const app = express()
// Config
app.set("views", "./views")
app.set("view engine", "html")
app.engine('html', mustache())


// Enable routes
app.get('/', router)
app.get('/publish', router)
app.get('/detailed', router)
app.get('/legal', router)

// Static files
app.use(express.static('./public'))

// LISTEN
app.listen(3000, () => {
  console.log('Listening on port 3000')
  console.log('Click here: http://localhost:3000/')
})