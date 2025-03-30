import mongoose from "mongoose"

const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASSWORD
let connection

async function dbConnection() {
    const uri = `mongodb+srv://${dbUser}:${dbPassword}@yield.l5iui68.mongodb.net/?retryWrites=true&w=majority&appName=Yield`

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            family: 4,
            maxPoolSize: 10
        })
        console.log('Connected to MongoDB')

        connection = mongoose.connection
        const db = connection.db
    } catch (error) {

        console.error('dbconnect Error:', {
            message: error.message,
            code: error.code,
            name: error.name
        })
        connection = null
        return {  message: 'Error connecting to database', error: error.message }
    }
}

export { dbConnection, connection }