import express from "express";
import cors from "cors";
import SETTING from "./src/config/system";
import routes from "./src/routes"

// Routes 
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// TODO: JWT Middleware
// Route implementations
app.use("/api", routes)


app.listen(SETTING.PORT, () => {
  console.log(`Server is running on port ${SETTING.PORT}`);
}); 