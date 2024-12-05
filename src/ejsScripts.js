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
      '<label>bcc: <input type="text" id="bccInput" /></label><br />';
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
  labels.innerHTML = ''

  if (files.length === 0) {
    return;
  }

  const file = fileInput.files[0];

  let output = "<label>labels: ";

  fetch(`http://localhost:3000/loadJSON?file=${encodeURIComponent(file.name)}`)
    .then((response) => response.json()) // Assuming server responds with JSON
    .then((data) => {
      data.forEach((x) => {
        output += `<button>${x.toLowerCase()}</button>&nbsp`
      });

      output += "</label>";

      labels.innerHTML = output;

      console.log("Response from server:", data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});
