import { authorize, sendMessage, getUserName } from "./googleAPI.js";
import { csvToJSON } from "./csvToJSON.js";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "path";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";
import { url } from "inspector";

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

async function logEmailSend(client, applicant) {
  const result = await client
    .db(databaseName)
    .collection(collectionName)
    .insertOne(applicant);
}

dotenv.config();

const uri = `mongodb+srv://tkofb:${process.env.MONGO_DB_PASSWORD.replace(
  "@",
  "%40"
)}@cluster0.4rkg4.mongodb.net/${
  process.env.MONGO_DB_NAME
}?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
const [databaseName, collectionName] = [
  process.env.MONGO_DB_NAME,
  process.env.MONGO_COLLECTION,
];

app.post("/sendEmails", async function (req, res) {
  let { bcc, cc, subject, message, json } = req.body;
  let successes = 0,
    failures = 0;

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
  process.stdout.write("\n")
  process.stdout.write("\n")

  data.forEach((x) => {
    let currentCC = parseString(cc, x);
    let currentBCC = parseString(bcc, x);
    let currentSubject = parseString(subject, x);
    let currentMessage = parseString(message, x);

    let email = [
      `From: 'Your Name' <your-email@gmail.com>`,
      `To: ${x["email"]}`,
      `CC: ${currentCC}`,
      `BCC: ${currentBCC}`,
      `Subject: ${currentSubject}`,
      ``,
      currentMessage,
    ];

    email = email.concat([``, `Sincerely,`, name]);
    email = email.join("\n");

    try {
      sendMessage(auth, email, x["email"]); // Your email sending function
      successes += 1;
    } catch (error) {
      failures += 1;
    }
  });

  const variables = {
    cc: cc,
    bcc: bcc,
    subject: subject,
    message: message,
    json: json,
    successes: successes,
    failures: failures,
  };

  await client.connect();
  await logEmailSend(client, variables);

  process.stdout.write("\n")
  process.stdout.write("Stop to shutdown the server: ");
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
