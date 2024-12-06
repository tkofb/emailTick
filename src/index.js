import { authorize, sendMessage, getUserName } from "./googleAPI.js";
import { csvToJSON } from "./csvToJSON.js";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "path";
import bodyParser from "body-parser";

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/src/ejsScripts.js", (req, res) => {
  res.type("application/javascript");
  res.sendFile(path.join(__dirname, "ejsScripts.js"));
});

app.get("/", (req, res) => {
  res.render("emailForm");
});

app.get("/loadJSON", (req, res) => {
  const fileName = req.query.file;
  const filePath = path.join(__dirname, `../datasets/${fileName}`);

  const json = csvToJSON(filePath);

  const keys = Object.keys(json[0]);

  // res.send(`Loaded file ${fileName}, keys: ${keys}`);
  res.send(keys);
});

function parseString(message, variables) {
  // Regular expression to match placeholders like ${variableName}
  const regex = /\$\{(\w+)\}/g;

  // Replace each placeholder with its corresponding value
  return message.replace(regex, (match, variableName) => {
    if (variables.hasOwnProperty(variableName)) {
      return variables[variableName];
    }
    // If the variable is not found, leave it unchanged or handle it
    return match;
  });
}
app.post("/sendEmails", async function (req, res) {
  let { bcc, cc, subject, message, json } = req.body;

  let jsonPath = path.join(__dirname, "../datasets", json);
  let data = csvToJSON(jsonPath);

  // Switch all keys to lowercase
  data = JSON.stringify(data);
  data = data.replace(/"([\w]+)":/g, function ($0, $1) {
    return '"' + $1.toLowerCase() + '":';
  });
  data = JSON.parse(data);

  let auth = await authorize();
  let name = await getUserName(auth);

  data.forEach((x) => {
    cc = parseString(cc, x);
    bcc = parseString(bcc, x);
    subject = parseString(subject, x);
    message = parseString(message, x);

    let email = [
      `From: 'Your Name' <your-email@gmail.com>`,
      `To: ${x['email']}`,
      `CC: ${cc}`,
      `BCC: ${bcc}`,
      `Subject: ${cc}`,
      ``,
      message,
    ];

    email = email.concat([``, `Sincerely,`, name]);
    email = email.join("\n");

    sendMessage(auth, email, name);
  });

  console.log(name)
  // authorize()
  //   .then((auth) => {
  //     getUserName(auth).then((name) => {
  //       email = email.concat([``, `Sincerely,`, name]);
  //       email = email.join("\n");

  //       data.forEach(element => {
  //         sendMessage(auth, email, name);
  //       });
  //     });
  //   })
  //   .catch(console.error);

  const variables = {
    cc: cc,
    bcc: bcc,
    subject: subject,
    message: message,
    json: json,
  };

  res.render("confirmEmails", variables);
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
