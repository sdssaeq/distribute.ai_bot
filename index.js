const WebSocket = require("ws");
const { HttpsProxyAgent } = require("https-proxy-agent");
const fs = require("fs");
const { promisify } = require("util");
const readFile = promisify(fs.readFile);

function generateRandomID() {
  const XI = 281474976710655;
  const fB = 32;
  const FE = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

  function Do(I, A) {
    if (isNaN(I) || I > XI || I < 0 || !Number.isInteger(I))
      throw new Error(`Invalid input: ${I}`);

    let D = "";
    for (let N = A; N > 0; N--) {
      const C = I % fB;
      D = FE.charAt(C) + D;
      I = Math.floor(I / fB);
    }
    return D;
  }

  function getRandomValue() {
    const randomValues = new Uint8Array(1);
    crypto.getRandomValues(randomValues);
    return randomValues[0] / 255;
  }

  function Eo(I) {
    let C = "";
    for (; I > 0; I--) {
      const A = Math.floor(getRandomValue() * fB);
      C = FE.charAt(A === fB ? fB - 1 : A) + C;
    }
    return C;
  }

  const D = Date.now();
  const go = 10;
  const Bo = 16;

  const encodedValue = Do(D, go);
  const repeatedString = Eo(Bo);
  return encodedValue + repeatedString;
}

function getRandomCpu() {
  const models = [
    "12th Gen Intel(R) Core(TM) i5-12400",
    "12th Gen Intel(R) Core(TM) i7-12700K",
    "13th Gen Intel(R) Core(TM) i9-13900K",
    "Intel(R) Core(TM) i5-13600KF",
    "Intel(R) Core(TM) i7-13700F",
  ];

  return models[Math.floor(Math.random() * models.length)];
}

function getRandomGPU() {
  const gpus = [
    "NVIDIA GeForce RTX 3060",
    "NVIDIA GeForce RTX 3070 Ti",
    "NVIDIA GeForce RTX 3080",
    "NVIDIA GeForce RTX 3090",
    "NVIDIA GeForce RTX 4090",
  ];

  return gpus[Math.floor(Math.random() * gpus.length)];
}

function getRandomHex(length) {
  const chars = "abcdef0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateSystemMessage(CpuName, GpuName, machineId) {
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getRandomUsage() {
    const total = getRandomInt(1000000000000, 2000000000000);
    const idle = getRandomInt(500000000000, total - 100000000000);
    const kernel = getRandomInt(1000000000, 10000000000);
    const user = total - idle - kernel;
    return { idle, kernel, total, user };
  }

  function getRandomProcessors(num) {
    const processors = [];
    for (let i = 0; i < num; i++) {
      processors.push({ usage: getRandomUsage() });
    }
    return processors;
  }

  const numOfProcessors = getRandomInt(12, 12);

  const data = {
    type: "system",
    data: {
      cpuInfo: {
        archName: "x86_64",
        features: [
          "mmx",
          "sse",
          "sse2",
          "sse3",
          "ssse3",
          "sse4_1",
          "sse4_2",
          "avx",
        ],
        modelName: CpuName, // Random once
        numOfProcessors: numOfProcessors,
        processors: getRandomProcessors(numOfProcessors), // Randomized
        temperatures: [],
      },
      memoryInfo: {
        availableCapacity: getRandomInt(1000000, 16000000), // Randomized
        capacity: getRandomInt(16000000, 32000000), // Randomized
      },
      gpuInfo: {
        vendor: "Google Inc. (NVIDIA)",
        renderer: `ANGLE (${GpuName} Direct3D11 vs_5_0 ps_5_0, D3D11)`, // Random once
      },
      operatingSystem: "windows",
      machineId, // Random once
    },
    id: generateRandomID(),
  };
  return data;
}

function generateHearbeatMessage() {
  const data = {
    type: "heartbeat",
    data: {
      version: "0.1.23",
      mostRecentModel: "unknown",
      status: "active",
      inferenceState: true,
    },
    id: generateRandomID(),
  };
  return data;
}

async function readtxt(path) {
  try {
    const data = await readFile(path, "utf8");
    const datas = data
      .replace(/\r/g, "")
      .trim()
      .split("\n")
      .filter((line) => line);
    return datas;
  } catch (err) {
    console.error("Error reading file:", err);
    return [];
  }
}

async function checkProxy() {
  const proxy = await readtxt("proxy.txt");
  if (proxy.length < 1) {
    return false;
  }
  return proxy;
}

async function websocket(token, proxy) {
  CpuName = getRandomCpu();
  GpuName = getRandomGPU();
  machineId = getRandomHex(32);

  const url = `wss://ws.distribute.ai/?token=${token}&version=0.1.23&platform=extension&lastConnectionId=`;
  const agent = new HttpsProxyAgent(proxy);

  let retryCount = 0;

  function connect() {
    const ws = new WebSocket(url, { agent });

    ws.on("open", () => {
      console.log("Connected to WebSocket");
      retryCount = 0; // Reset retry counter on successful connection

      const message1 = JSON.stringify(generateHearbeatMessage());
      ws.send(message1);
      console.log("Sending HeartBeat");

      const message2 = JSON.stringify(
        generateSystemMessage(CpuName, GpuName, machineId)
      );
      ws.send(message2);
      console.log("Sending System Info");

      // Send first message every 1 minute
      setInterval(() => {
        const message1 = JSON.stringify(generateHearbeatMessage());
        ws.send(message1);
        console.log("Sending HeartBeat");
      }, 60000);

      // Send second message every 1 hour
      setInterval(() => {
        const message2 = JSON.stringify(
          generateSystemMessage(CpuName, GpuName, machineId)
        );
        ws.send(message2);
        console.log("Sending System Info");
      }, 3600000);
    });

    ws.on("message", (data) => {
      console.log("Message from server:", data.toString());
    });

    ws.on("error", (error) => {
      console.error("WebSocket Error:", error);
    });

    ws.on("close", () => {
      console.log("Socket closed. Reconnecting...");
      retryCount++;
      const retryDelay = Math.min(5000, Math.pow(2, retryCount) * 1000); // Exponential backoff with max 30s
      setTimeout(connect, retryDelay);
    });
  }

  connect();
}

async function main() {
  const token = await readtxt("token.txt");
  const proxy = await readtxt("proxy.txt");
  const check = await checkProxy();
  for (let i = 0; i < token.length; i++) {
    if (check) {
      await websocket(token[i], proxy[i]);
      console.log("\x1b[32m[PROXY]\x1b[0m");
    } else {
      await websocket(token[i]);
      console.log("\x1b[31m[PROXY]\x1b[0m");
    }
  }
}
main();
