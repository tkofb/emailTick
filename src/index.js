import { authorize, sendMessage, listLabels } from "./googleAPI.js";
import { csvToJSON } from "./csvToJSON.js";
import express from "express";
import path from "path"
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.render("emailForm");
});

app.listen(port, function (error) {
  if (error) {
    console.log("Something Went Wrong: ", error);
  } else {
    process.stdout.write(
      "Web server started and running at http://localhost:" + port + "\n"
    );
    process.stdout.write("Stop to shutdown the server: ");
  }
});

process.stdin.setEncoding("utf8");

function promptNextLine(dataInput, command) {
  dataInput = process.stdin.read();

  if (dataInput !== null) {
    command = dataInput.trim().toLowerCase();
    if (command === "stop") {
      console.log("Shutting down the server");
      process.exit(0);
    } else {
      process.stdout.write(`Invalid command: ${command}\n`);
      process.stdout.write("Stop to shutdown the server: ");
      promptNextLine(dataInput, command);
    }
  }
}

process.stdin.on("readable", () => {
  let dataInput, command;
  promptNextLine(dataInput, command);
});

// authorize().then(listLabels).catch(console.error);

// console.log(csvToJSON('../datasets/data.csv'))
