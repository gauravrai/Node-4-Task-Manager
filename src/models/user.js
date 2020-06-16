const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true,
        validate(value){
            if(value.length<7){
                throw Error('Password must be at least seven characters')
            }
            else if(value.toLowerCase().includes('password')){
                throw Error('Password cannot include text password')
            }
        }
    },
    email: {
        type: String,
        validate (value){
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid')
            }
        },
        trim: true,
        unique: true
    },
    age: {
        type: Number,
        validate(value){
            if(value<0){
                throw new Error('Age should not be less than 0')
            }
        },
        default: 0
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})
//
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email})
    if(!user){
        throw new Error("Unable to login")
    }
    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch)
        throw new Error('Unable to login')
    
    return user
}
userSchema.methods.generateAuthToken = async function (){
    const user = this

    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET)
    user.tokens = user.tokens.concat({token})
    
    await user.save()
    return token
}  
userSchema.methods.toJSON = function (){
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}
//middleware to encrypt the password
userSchema.pre('save', async function (next){
    const user = this
    console.log('Just before save')
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }
    next()
})

//delete tasks
userSchema.pre('remove', async function (next){
    const user = this
    await Task.deleteMany({
        owner: user._id
    })
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User