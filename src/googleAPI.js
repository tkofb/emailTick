import fs from "fs/promises";
import path from "path";
import process from "process";
import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";

// If modifying these scopes, delete token.json.
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.profile",
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */

export async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
export async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
export async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Find the connected users name
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */

export function getUserName(auth) {
  const people = google.people({ version: "v1", auth });
  return people.people
    .get({
      resourceName: "people/me",
      personFields: "names",
    })
    .then((response) => {
      const name = response.data.names[0]?.displayName;
      return name || "Your Name";
    });
}

const email = [
  `From: 'Your Name' <your-email@gmail.com>`,
  `To: benard.kihiuria@gmail.com`,
  `CC: a@gmail.com`,
  `BCC: b@gmail.com`,
  `Subject: Seding a Text With A Name`,
  ``,
  'Test with name.',
];
/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */

export async function sendMessage(auth, email, name) {
  const gmail = google.gmail({ version: "v1", auth });

  // Encode the email in Base64 (URL-safe)
  const base64EncodedEmail = Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // Send the email
  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      labelIds: ["INBOX", "UNREAD", "IMPORTANT"],
      raw: base64EncodedEmail,
    },
  });

  console.log(res.data);
}

