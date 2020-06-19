const express = require('express')
const auth = require('../middleware/auth')
const router = express.Router()
const User = require('../models/user')
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account.js')


router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try{
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        
        res.status(201).send({
            user,
            token
        })
    } catch(e){
        res.status(400).send(e)
    }
})
router.get('/users/logoutAll', auth, async (req, res) => {
    
    try{
        req.user.tokens = []
        await req.user.save()
        res.send()
    }
    catch(e){
        res.status(500).send(e)
    }
})
router.post('/users/login', async (req, res) => {
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({
            user,
            token
        })
    }catch(e){
        res.status(400).send(e)
    }
})


router.get('/users/logout', auth, async (req, res) => {
    try{
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token != req.token
        })
        await req.user.save()
        res.send()
    }
    catch(e){
        res.status(500).send(e)
    }
})

router.get('/users/me', auth, async (req, res) => {
    const _id = req.user._id

    try{
        const user = await User.findById(_id)
        if(user)
            res.send(user)
        else
            res.status(401).send('Not found')
    }
    catch(e){
        res.status(500).send('Internal server error 1')
    }
    
})
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
    if(!isValidOperation){
        return res.status(400).send({isValidOperation, 'error': 'Invalid updates'})
    }
    
    try{
        const user = await User.findById(req.user._id)
        updates.forEach((update) => user[update] = req.body[update])
        await user.save()
        //update went fine
        return res.send(user)
    }
    catch(e){
        res.status(500).send('Internal server error 2')
    }
})
router.delete('/users/me', auth, async (req, res) => {
    try{
        await req.user.remove()
        sendCancellationEmail(req.user.email, req.user.name)
        return res.send(req.user)
        
        res.send(user)
    }
    catch(e){
        res.status(500).send('Internal server error 3')
    }
})
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error ('Please upload a image'))
        }
        
        return cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) =>{
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
    }, (error, req, res, next) => {
        res.status(400).send({
            error: "Upload image"
        })
})
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = null
    await req.user.save()
    
    res.send()
})
router.get('/users/:id/avatar', async (req, res) => {
    try{

        const user = await User.findById(req.params.id)
        if(!user || !user.avatar ){
            throw new Error('Record not found')
        }
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    }catch(e){
        res.status(400).send()
    }
})
module.exports = router