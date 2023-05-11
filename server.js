//import express from "express" can be used but you must add the type: "module" in package.json
import express from "express";
import morgan from "morgan";
import cors from "cors";
import connect from "./database/connection.js";
import router from "./router/route.js";

const port = 8080
const app = express()

/** middlewares */
app.use(express.json())
app.use(cors())
app.use(morgan('tiny'))
app.disable('x-powered-by'); 

/** HTTP GET request */
app.get('/', (req, res) =>{
     res.status(201).json("Home get request");
})
/** api router */
app.use('/api', router)
/** start server only when we have a valid connection */
connect().then(() => {
     try {
          app.listen(port, () => {
               console.log(`app running on http://localhost:${port}...`);
          })
     } catch (error) {
          console.log('Can not connect to the  server', error);
     }
}).catch(error =>{
     console.log('Invalid database connection...!', error);
})

//runned successfully