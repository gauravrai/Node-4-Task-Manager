const express = require('express')
const router = express.Router()
const Task = require('../models/task')
const auth = require('../middleware/auth')

router.post('/tasks', auth, async (req, res) => {
    //const task = new Task(req.body)
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    try{
        await task.save()
        res.status(201).send(task)
    }
    catch(e){
        console.log(e)
        res.status(400).send(e)
    }
    
})
router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
    if(!isValidOperation){
        return res.status(400).send({isValidOperation, 'error': 'Invalid updates'})
    }

    try {
        const task = await Task.findOne({
            _id: req.params.id,
            owner: req.user._id
        })
        updates.forEach((update) => {
            task[update] = req.body[update]
        })
        await task.save()
        if(!task){
            return res.status(404).send('Task not found')
        }
        res.status(201).send(task)
    }
    catch(e){
        res.status(500).send(e)
    }
})
//GET /tasks/?completed=true or false
//GET /tasks/?limit=10&skip=4
//GET /tasks/?sortBy=createdAt_asc or _desc
router.get('/tasks', auth, async (req, res) => {
    try{
        const match = {}
        const sort = {}

        if(req.query.completed){
            match.completed = req.query.completed === 'true'
        }
        
        if(req.query.sortBy){
            const parts = req.query.sortBy.split('_')
            sort[parts[0]] = (parts[1]==='desc') ? -1 : 1
        }
        
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    } catch(e){
        res.status(500).send('Internal server error')
    }
})
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    try{
        const task = await Task.findOne({
            _id,
            owner: req.user._id
        })
        if(task){
            res.status(201).send(task)
        }
        else{
            res.status(404).send('Record not found')
        }
    }
    catch(e){
        res.status(500).send(e)
    }
})
router.delete('/tasks/:id', auth, async (req, res) => {
    try{
        const cTask = await Task.findOne({
            _id: req.params.id,
            owner: req.user._id
        })
        if(!cTask){
            return res.status(404).send()
        }
        const task = await Task.deleteOne({
            _id: req.params.id,
            owner: req.user._id
        })
        
        res.send(cTask)
    }
    catch(e){
        res.status(500).send(e)
    }
})

module.exports = router