import express from 'express'
import mustache from "mustache-express"
import bodyParser from 'body-parser'
import router from './router.js'
import cookieParser from 'cookie-parser'
import loggerMiddleware from "./tools/serverLogger.js"


// INIT
const app = express()

// Config
app.set("views", "./views")  // Set views folder as default folder for templates
app.set("view engine", "html")  // Use html as template engine
app.engine('html', mustache())  // Use mustache as template engine
app.use(bodyParser.urlencoded({ extended: true }))  // Manage POST requests
app.use(cookieParser())  // Manage cookies
app.use(loggerMiddleware)

// Enable routes
app.get('/', router)
app.get('/publish', router)
app.get('/detailed/:id', router)
app.get('/legal', router)
app.get('/edit/:id', router)
app.get('/delete/:id', router)
app.get('/quit-errorMsg', router)
app.get("/toggle-fav", router)
app.get("/clear-favs-list", router)

// POST routes
app.post('/add-element', router)
app.post('/edit-element/:id', router)
app.post('/add-bid/:id', router)


// Static files
app.use(express.static('./public'))

// LISTEN
app.listen(3000, () => {
  console.log('Listening on port 3000')
  console.log('Click here: http://localhost:3000/')
})