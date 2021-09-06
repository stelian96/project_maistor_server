const mongoose = require('mongoose')

mongoose.connect('mongodb+srv://stelko135:N@PP7upp@cluster0.bqlne.mongodb.net/Test?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
})