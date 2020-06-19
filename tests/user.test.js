const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const {userOne, userOneId, setupDatabase} = require('./fixtures/db')

beforeEach(setupDatabase)



test('Should signup as a new user', async () => {
    const response = await request(app).post('/users')
                .send({
                    name: 'Gaurav',
                    email: 'gauravq@gmail.com',
                    password: 1234567
                }).expect(201)
    
    //Assert that database is changed
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    //Assert response
    expect(response.body).toMatchObject({
        user: {
            name: 'Gaurav',
            email: 'gauravq@gmail.com',
        },
        token: user.tokens[0].token
    })
    //Assert password
    expect(user.password).not.toBe('1234567')

})

test('Should login successfull', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)

    const user = await User.findById(response.body.user._id)

    expect(user).not.toBeNull()
    
    expect(response.body.token)
        .toBe(user.tokens[1].token)
})

test('Should fail login', async () => {
    await request(app).post('/users/login').send({
        email: userOne.email,
        password: '123456'
    }).expect(400)
})

test('Should get user profile ', async () => {
    await request(app)
            .get('/users/me')
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .send()
            .expect(200)
})
test('Should not get profile for unauthenticated user', async () => {
    await request(app)
            .get('/users/me')
            .send()
            .expect(401)

})
test('Should delete profile', async () => {
    await request(app)
            .delete('/users/me')
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .send()
            .expect(200)

    const user = await User.findById(userOne._id)

    expect(user).toBeNull()
})
test('Shoudl not delete profile without authentication', async () => {
    await request(app)
            .delete('/users/me')
            .send()
            .expect(401)
})

test('Should upload avatar', async () => {
    await request(app)
            .post('/users/me/avatar')
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .attach('avatar', 'tests/fixtures/profile-pic.jpg')
            .expect(200)
    const user = await User.findById(userOneId)
    expect(user.avatar).toEqual(expect.any(Buffer))
})

test('Should update valid fields', async () => {
    await request(app)
            .patch('/users/me')
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .send({
                name: "Gaurav"
            })
            .expect(200)
    const user = await User.findById(userOneId)
    expect(user.name).toBe('Gaurav')
})

test('Should not update invalid fields', async () => {
    await request(app)
            .patch('/users/me')
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .send({
                location: 'XYZ'
            })
            .expect(400)
})