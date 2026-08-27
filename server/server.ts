import express, { type Request, type Response } from "express";
import cors from "cors";
import SETTING from "./src/config/system";
import testRouter from "./src/routes/test.route";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Route implementations


app.listen(SETTING.PORT, () => {
  console.log(`Server is running on port ${SETTING.PORT}`);
}); 