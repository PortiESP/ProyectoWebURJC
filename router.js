import express from 'express'
import {data, sizes, types} from './service.js'
import formatDate from './tools/dateUtils.js'
import avatarGenerator from './tools/avatarGenerator.js'

// INIT
const router = express.Router()
let dataValues = Object.values(data)

// Declare possible routes (not enabled until enabled by `app.get()`)
router.get('/', renderIndex)
router.get('/detailed/:id', renderDetailed)
router.get('/publish', renderPublish)
router.get('/legal', (req, res) => res.render('legal'))
router.get('/delete-element/:id', handleDeleteElement)
router.get('/edit/:id', renderEdit)

// POST routes
router.post('/add-element', handleAddElement)
router.post('/add-bid/:id', handleAddBid)
router.post('/edit-element/:id', handleEdit)

//===================================================[Functions]===================================================//

// Rendering Functions -------------------------------------------------
function renderIndex(req, res) {
	res.render('index', { dataValues })
}

function renderDetailed(req, res) {
	const bids = data[req.params.id]?.bids			        	// Extract bids from data and sort them
	const elementData = data[req.params.id]         			// Extract element data from data

	res.render('detailed', { ...elementData, bids, isEmpty: !bids?.length })
}

function renderPublish(req, res) {
	const today = new Date().toISOString().split('T')[0]
	const pageTitle = "Sell your best Garments!"
	const pageMessage = "Publish"

	const route = "/"
	const postRoute = "/add-element"

	res.render('publish', { today, types, sizes, pageTitle, pageMessage, route, postRoute })
}

function renderEdit(req, res) {
	const today = new Date().toISOString().split('T')[0]
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
	
	res.render('publish', { ...data[req.params.id], today, finishingDate,
							types, sizes, pageTitle, pageMessage, route, postRoute
						  }
	)
}

// Handling Functions --------------------------------------------------
function handleAddElement(req, res) {
	const id = Date.now()
	const bids = []
	const price = parseFloat(req.body.price)
	const finishingDate = formatDate(req.body.finishingDate)

	data[id] = { id, ...req.body, finishingDate, price, bids }
	dataValues = Object.values(data)
	res.redirect(`/detailed/${id}`)
}

function handleEdit(req, res) {
	const id = req.params.id
	const price = parseFloat(req.body.price)
	const finishingDate = formatDate(req.body.finishingDate)
	const bids = data[id].bids

	data[id] = { id, ...req.body, finishingDate, price, bids }
	res.redirect(`/detailed/${id}`)
}

function handleDeleteElement(req, res) {
	const id = req.params.id
	delete data[id]
	dataValues = Object.values(data)
	res.redirect(`/`)
}

function handleAddBid(req, res) {
	const id = req.params.id
	const date = formatDate(Date.now())
	const bid = parseFloat(req.body.bid)
	const picture = avatarGenerator(req.body.email)

	if (data[id].price > bid || data[id].bids[0]?.bid > bid) {
		res.redirect(`/detailed/${id}?error=1`)
	} else {
		data[id].bids = [{ ...req.body, date, bid, picture }, ...data[id].bids]
		res.redirect(`/detailed/${id}`)
	}
}

// Export routes definitions
export default router