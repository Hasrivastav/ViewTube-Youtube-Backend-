import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app =  express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

//this mean swe are accepting Json data (it is for data which comes from form)
app.use(express.json({limit:"16kb"}))

app.use(express.urlencoded({extended:true,limit:"16kb"}))
// The express.urlencoded() middleware in Express.js is used to parse incoming request bodies with URL-encoded payloads. It's a middleware specifically designed to handle form submissions and allows Express to interpret data sent from HTML forms submitted via the POST method.

app.use(express.static("public"))
// The express.static() middleware in Express.js is used to serve static files, such as HTML, CSS, images, JavaScript files, and other assets, from a specific directory to the client.

app.use(cookieParser());

//routes import
import userRouter from './routes/user.routes.js'
//routes declaration
app.use("/api/v1/users",userRouter)

export {app}

// Middlewares execute between the incoming request and the corresponding route handler, allowing you to perform operations like logging, authentication, data validation, request parsing, and more. This helps preprocess incoming data before it reaches the route handler