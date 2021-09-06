const express = require('express')
const cors = require('cors')
require('./db/mongoose')
const userRouter = require('./routers/user')
const ServiceRouter = require('./routers/service')


const app = express()
app.use(cors())



//Serves all the request which includes /images in the url from Images folder
app.use(express.static('public'));
app.use('/avatars', express.static(__dirname + '/public/avatars'));
app.use('/uploads', express.static(__dirname + '/public/uploads'));

const port = process.env.PORT

app.use(express.json())

app.use(userRouter)
app.use(ServiceRouter)

app.listen(port, () => {
    console.log('Server is up on port ' + port)
})