const { downloadFile } = require("@huggingface/hub");
const fs = require("fs");
const path = require("path");

const spinnerFrames = ["|", "/", "-", "\\"];
let spinnerIndex = 0;

function startSpinner(text = "Downloading") {
  return setInterval(() => {
    process.stdout.write(
      `\r${spinnerFrames[spinnerIndex++ % spinnerFrames.length]} ${text}`
    );
  }, 120);
}

function stopSpinner(interval, text = "Done") {
  clearInterval(interval);
  process.stdout.write(`\r✔ ${text}\n`);
}

(async function () {
  let spinner;

  try {
    spinner = startSpinner("Downloading model");

    const blob = await downloadFile({
      repo: "TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF",
      path: "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf",
      // accessToken: process.env.HF_TOKEN
    });

    const buffer = Buffer.from(await blob.arrayBuffer());

    const targetPath = path.join(
      __dirname,
      "llama.cpp",
      "models",
      "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"
    );

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, buffer);

    stopSpinner(spinner, "Download completed");
    console.log("Saved to:", targetPath);
  } catch (err) {
    if (spinner) stopSpinner(spinner, "Failed");
    console.error("[hf.cjs]:", err);
  }
})();


