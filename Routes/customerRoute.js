const { Router } = require("express");
const { register, logIn, fetchData, handleMail, test } = require("../Controllers/customerController");
const router=Router()

router.post('/register',register)
router.post('/login',logIn)
router.get('/profile',fetchData)
router.get('/test',test)
router.post('/sendMail',handleMail)

module.exports=router