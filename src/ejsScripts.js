const fileInput = document.getElementById("json");
const labels = document.getElementById("labels");
const cc = document.getElementById("cc");
const bcc = document.getElementById("bcc");

function handleCC() {
  if (cc.innerHTML == "") {
    cc.innerHTML +=
      '<label>cc: <input type="text" id="ccInput" /></label><br />';
  } else {
    cc.innerHTML = "";
  }
}

function handleBCC() {
  if (bcc.innerHTML == "") {
    bcc.innerHTML +=
      '<label>bcc: <input type="text" id="bccInput" /></label><br /><br />';
  } else {
    bcc.innerHTML = "";
  }
}

function checker() {
  if (
    window.confirm(
      "Are you sure you want to submit your application?\nYou will not be able to change your information once submitted."
    )
  ) {
    document.getElementById("form").submit();
  } else {
    return;
  }
}

fileInput.addEventListener("change", () => {
  const files = fileInput.files;

  if (files.length === 0) {
    labels.innerHTML = "<label>labels: <p>no files selected.</p></label>";
    return;
  }

  const file = fileInput.files[0];

  let output = "<label>selected files:<br>";

  output += "</label>";

  labels.innerHTML = output;

  // window.location.href = '/test'
  fetch(`http://localhost:3000/loadJSON?file=${encodeURIComponent(file.name)}`)
    .then((response) => response.text()) // Assuming server responds with JSON
    .then((data) => {
      console.log("Response from server:", data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});
