const fs = require("fs");
const readline = require("readline");

const prefixes = [
  "El",
  "Al",
  "Jo",
  "Da",
  "Ma",
  "Le",
  "Ja",
  "Mi",
  "Ro",
  "Ti",
  "Ka",
  "Lu",
  "Sa",
  "Ni",
  "Be",
  "Ra",
  "Si",
  "Ta",
  "Vi",
  "Za",
  "Ga",
  "Ha",
  "Pa",
  "Qu",
  "Re",
  "Se",
  "Te",
  "Ula",
  "Ve",
  "We",
  "Xa",
  "Ya",
  "Ze",
  "Ari",
  "Bri",
  "Cal",
  "Del",
  "Eli",
  "Fia",
  "Geo",
  "Har",
  "Ivy",
  "Jor",
  "Kel",
  "Lau",
  "Mae",
  "Nel",
  "Oli",
  "Pri",
  "Rho",
  "Sol",
  "Tri",
  "Uma",
  "Val",
  "Win",
  "Xan",
  "Yve",
  "Zoe",
];
const suffixes = [
  "son",
  "ton",
  "man",
  "wood",
  "field",
  "stone",
  "ford",
  "ley",
  "mont",
  "brook",
  "ville",
  "worth",
  "ridge",
  "crest",
  "lake",
  "hill",
  "view",
  "haven",
  "port",
  "gate",
  "shire",
  "well",
  "spring",
  "glen",
  "dale",
  "moor",
  "cliff",
  "bluff",
  "frost",
  "wind",
  "shadow",
  "light",
  "storm",
  "fire",
  "earth",
  "sky",
  "sea",
  "star",
  "moon",
  "sun",
  "bloom",
  "thorn",
  "leaf",
  "root",
  "vine",
  "bark",
  "flame",
  "mist",
  "wave",
  "sand",
  "rock",
  "cove",
  "peak",
  "vale",
  "grove",
];

function generateRandomName() {
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return prefix + suffix;
}

async function createProvider(token, nameProvider) {
  const crate = await fetch("https://api.distribute.ai/internal/auth/connect", {
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      authorization: token,
      "cache-control": "no-cache",
      "content-type": "application/json",
      pragma: "no-cache",
      priority: "u=1, i",
      "sec-ch-ua":
        '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      Referer: "https://dashboard.distribute.ai/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    body: `{"name":"${nameProvider}","platform":"browser"}`,
    method: "POST",
  });

  return await crate.json();
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const tokenInput = await new Promise((resolve) => {
    rl.question("Enter the token: ", (input) => {
      resolve(input);
    });
  });

  const loopCountInput = await new Promise((resolve) => {
    rl.question("Enter the number of loops: ", (input) => {
      resolve(parseInt(input, 0));
    });
  });

  rl.close();

  if (isNaN(loopCountInput) || loopCountInput <= 0) {
    console.log("Invalid number of loops. Please enter a positive number.");
    return;
  }

  for (let i = 0; i < loopCountInput; i++) {
    const name = generateRandomName();
    const randomNumber = Math.floor(Math.random() * 900) + 100;
    const { token } = await createProvider(tokenInput, name + randomNumber);

    fs.appendFile("providergen.txt", token + "\n", (err) => {
      if (err) {
        console.log("Error writing to file", err);
      }
    });

    console.log("provider Token Generated at providergen.txt");
  }
}

main();
