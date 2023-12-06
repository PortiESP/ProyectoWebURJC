import express from "express"
import { data, featured, favorites, sizes, types } from "./service.js"

// AUX FUNCTIONS
import formatDate from "./tools/dateUtils.js"
import avatarGenerator from "./tools/avatarGenerator.js"
import {publishErrorManager, bidErrorManager} from "./tools/errorManager.js"
import {uuidGenerator} from "./tools/uuidGenerator.js"

// CONSTANTS
const TODAY = new Date().toISOString().split('T')[0]
const DEFAULT_PAGE = "Default"
const DETAILED_PAGE = "Detailed"

// INIT
const router = express.Router()

// Declare possible routes (not enabled until enabled by `app.get()`)
router.get("/", renderIndex);
router.get("/detailed/:id", renderDetailed);
router.get("/publish", renderPublish);
router.get("/publish", renderPublish);
router.get("/legal", (_, res) => res.render("legal"));
router.get("/edit/:id", renderEdit)

router.get("/delete/:id", handleDeleteElement)
router.get("/quit-errorMsg", handleQuitErrorMsg )
router.get("/toggle-fav", handleToggleFav)

// POST routes
router.post("/add-element", handleAddElement)
router.post("/add-bid/:id", handleAddBid)
router.post("/edit-element/:id", handleAddElement)

//================================================================[Functions]================================================================//


// Rendering Functions --------------------------------------------------------------------------------------------------
function renderIndex(req, res) {
    // Extract data of the elements to be featured
    const featuredItems = [...featured].map(id => data[id])

    // Render page
    res.render("index", { dataValues: Object.values(data), featuredItems, ...renderNav(req, res) })
}

function renderDetailed(req, res) {
    const id = req.params.id

    // Template page values
    const templateParams = {
        ...data[id],  // Element data
        isEmpty: !(data[id]?.length),  // Bids array is empty
        isFav: favorites[req.cookies.uuid].has(id),  // Element is in used favorites list
    }
    
    // Handle errors
    let errors = []
    const error = req.query.error  // Error flag
    if (error) errors = decodeURIComponent(req.query.errorMsg).split(",")  // Error list (from query)

    // Render page
    res.render("detailed", { ...templateParams, error, errors, ...renderNav(req, res) })
}

function renderPublish(req, res) {
    // Template page values
    const templateParams = {
        pageTitle: "Sell your best Garments!",
        cancelRoute: "/",
        postRoute: "/add-element",
        today: new Date().toISOString().split('T')[0],
        referrer: req.get('Referrer'),
    }

    // Handle errors
    let errors = []
    const error = req.query.error  // Error flag
    if (error) errors = decodeURIComponent(req.query.errorMsg).split(",")  // Error list (from query)

    // Render page
    res.render("publish", { ...templateParams, types, sizes, error, errors, ...renderNav(req, res) })
}


function renderEdit(req, res) {
	const id = req.params.id

	const finishingDate = data[id].finishingDate.split('/').reverse().join('-')
	const selectedType = data[id].type
	const selectedSize = data[id].size

	const pageTitle = "Edit your selling"
	const pageMessage = "Edit"

	const route = `/detailed/${id}`
	const postRoute = `/edit-element/${id}`

	types.forEach(one => one.selected = one.type === selectedType ? 'selected' : '')
	sizes.forEach(one => one.selected = one.size === selectedSize ? 'selected' : '')

    if (!req.query.error) {
        const error = false
        const notError = "notError"

        res.render('publish', {
            ...data[id], today: TODAY, finishingDate, error, notError,
            types, sizes, pageTitle, pageMessage, route, postRoute, ...renderNav(req, res)
        })

    } else {
        const error = true
        const notError = ""
        const errors = data[id].errors

        res.render('publish', {
            ...data[id], today: TODAY, finishingDate, error, notError, errors,
            types, sizes, pageTitle, pageMessage, route, postRoute, page: DEFAULT_PAGE, ...renderNav(req, res)
        })
    }
}

// Sub-components Rendering Functions --------------------------------------------------------------------------------------------------

function renderNav(req, res){
    // Cookies
    let uuid = req.cookies.uuid
    if (!uuid) {
        uuid = uuidGenerator()
        res.cookie("uuid", uuid)  // Generate uuid cookie if not exists
        favorites[uuid] = new Set()
    }
    if (favorites[uuid] === undefined) favorites[uuid] = new Set()
     
    // Extract favorite elements of the user
    const favs = [...favorites[uuid]].map(id => data[id]) || []

    return {favs}
}


// Handling Functions ------------------------------------------------------------------------------------------------------------------
function handleDeleteElement(req, res) {
    const id = req.params.id
    delete data[id]
    favorites[req.cookies.uuid].delete(id)
    featured.delete(id)

    res.redirect(`/`)
}


function handleQuitErrorMsg(req, res) {
    // Redirect to previous page (do not keep error message in query)
    res.redirect(req.get('Referrer').split('?')[0])
}


function handleAddElement(req, res) {
    console.log(req.body)
    // Validate form data
    const errors = publishErrorManager(req.body)
    if (errors)  // Errors - Redirect to publish page
        res.redirect(`/publish?error=true${errors}`) 
    else {  // No errors - Add element to data
        // Add new element object to data
        data[id] = {
            newElementID: Date.now(),  // Generate element ID, based on current time
            finishingDate: formatDate(req.body.finishingDate),  // Format finishing date
            price: parseFloat(req.body.price),  // Format price (float)
            ...req.body,  // Add rest of form data
            bids: []  // Initialize bids array
        }
        res.redirect(`/detailed/${id}`)
    }
}


function handleAddBid(req, res) {
    const id = req.params.id
    const date = formatDate(Date.now())

    const bid = parseFloat(req.body.bid)
    const name = req.body.name
    const email = req.body.email

    let price
    data[id].bids.length ? price = parseFloat(data[id].bids[0].bid) : price = parseFloat(data[id].price)

    const errors = bidErrorManager({ bid, name, email, price })
    const picture = avatarGenerator(req.body.email)
    
    if (errors) {
        res.redirect(`/detailed/${id}?error=true${errors}`)
    } else {
        data[id].bids = [{ ...req.body, date, bid, picture }, ...data[id].bids]
        res.redirect(`/detailed/${id}`)
    }
}


function handleToggleFav(req, res){
    const id = req.query.id
    const uuid = req.cookies.uuid

    if (favorites[uuid].has(id)) favorites[uuid].delete(id)
    else favorites[uuid].add(id)

    console.log(favorites)

    res.json({success: true})
}

// Export routes definitions
export default router