const request = require('supertest')
const app = require('../src/app')
const Task = require('../src/models/task')
const {userOne, userOneId, setupDatabase, taskOne, userTwo} = require('./fixtures/db')
const { send } = require('@sendgrid/mail')

beforeEach(setupDatabase)

test('Should create task for the user', async () => {
    const response = await request(app)
                        .post('/tasks')
                        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
                        .send({
                            description: "new task added"
                        })
                        .expect(201)
    const task = await Task.findById(response.body._id)
    expect(task).not.toBeNull()
    expect(task.completed).toBe(false)
})

test('Should get tasks', async () => {
    const response = await request(app)
                        .get('/tasks')
                        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
                        .send()
                        .expect(200)
    
    expect(response.body.length).toBe(2)
})

test('Should not delete other user task', async () => {
    const response = await request(app)
                        .delete('/tasks/' + taskOne._id)
                        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
                        .send()
                        .expect(404)
    

})  