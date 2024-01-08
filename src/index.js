// require('dotenv').config({path: './env'})
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: './env',
});

connectDB()
.then(() => {
    // app.on("error", (error) => {
    //   console.log(`Error occured`, error);
    //   throw error;
    // });

    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port:${process.env.PORT}`);
    });
  })
.catch((error) => {
    console.log("Could not Connect to Database", error);
  });

//   ertainly! In Node.js, when you create an HTTP server using modules like Express.js or the built-in http module, the app object often represents an instance of your web application or server.

// The line app.on("error", (error) => { ... }) sets up an error handling mechanism for this app instance. Specifically, it registers an event listener for the "error" event on the app object.
