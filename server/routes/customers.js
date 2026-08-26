const express = require("express")
const { validateBody } = require("../middleware")
const customerController = require("../controllers/customerController")

const router = express.Router()
router.get("/", customerController.getAllCustomers)
router.get("/:id", customerController.getCustomerById)
router.post("/", validateBody(["fullName", "status"]), customerController.createCustomer)
router.patch("/:id", customerController.updateCustomer)
router.delete("/:id", customerController.deleteCustomer)

module.exports = router
