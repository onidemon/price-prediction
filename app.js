const express = require("express");
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const app = express();
const cors = require("cors");

const baseDir = "./data/stock_price_data_files";
const exchanges = ["NASDAQ", "LSE", "NYSE"];
const port = 3000;
const host = "127.0.0.1";

// Bodyparser middleware
app.use(express.json());

// CORS Middleware
app.use(cors());
app.options("*", cors());

const getDataPoints = (inputValues, callback) => {
  const results = [];
  let filesProcessed = 0;
  let totalFilesToProcess = 0;

  for (const exchange of exchanges) {
    const exchangeDir = path.join(baseDir, exchange);

    if (
      !fs.existsSync(exchangeDir) ||
      !fs.statSync(exchangeDir).isDirectory()
    ) {
      results.push({ [exchange]: "Dir does not exist or is not accessible" });
      continue;
    }

    const files = fs
      .readdirSync(exchangeDir)
      .filter((file) => file.endsWith(".csv"));

    if (!files.length) {
      results.push({ [exchange]: "No files found" });
      continue;
    }

    files.sort(() => 0.5 - Math.random());
    const filesToProcess = files.slice(0, Math.min(files.length, inputValues));
    totalFilesToProcess += filesToProcess.length;

    filesToProcess.forEach((file) => {
      const filePath = path.join(exchangeDir, file);
      const data = [];
      const parser = fs
        .createReadStream(filePath)
        .pipe(parse({ columns: false }));

      parser.on("readable", () => {
        let record;
        while ((record = parser.read()) !== null) {
          data.push(record);
        }
      });

      parser.on("end", () => {
        filesProcessed++;
        if (data.length === 0 || data.length < 10) {
          results.push({ [file]: "File is empty or not enough data points" });
        } else {
          const startIdx = Math.floor(Math.random() * (data.length - 10));
          const selectedData = data.slice(startIdx, startIdx + 10);
          const stockId = path.basename(file, ".csv");
          results.push({
            "Stock-ID": stockId,
            Exchange: exchange,
            "Data-Points": selectedData,
          });
        }

        if (filesProcessed === totalFilesToProcess) {
          callback(results);
        }
      });

      parser.on("error", (error) => {
        filesProcessed++;
        results.push({ [file]: `Error parsing file: ${error.message}` });
        if (filesProcessed === totalFilesToProcess) {
          callback(results);
        }
      });
    });
  }
};

// Load data points
app.use("/api/data-points", (req, res) => {
  if (!req.body || !req.body.input_values) {
    return res.status(400).json({ error: "Number of input values is missing" });
  }

  const inputValues = req.body.input_values;

  if (typeof inputValues !== "number" || inputValues < 1) {
    return res.status(400).json({ error: "Invalid input value" });
  }

  getDataPoints(inputValues, (results) => {
    res.json(results);
  });
});

// Get 3 predictions
app.post("/api/data-prediction", (req, res, next) => {
  if (!req.body || !req.body.input_values) {
    return res.status(400).json({ error: "Number of input values is missing" });
  }

  const inputValues = req.body.input_values;

  if (typeof inputValues !== "number" || inputValues < 1) {
    return res.status(400).json({ error: "Invalid input value" });
  }

  getDataPoints(inputValues, (dataPoints) => {
    const outputDir = path.join(baseDir, "output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const csvFiles = [];

    dataPoints.forEach((item) => {
      const stockId = item["Stock-ID"];
      const points = item["Data-Points"];
      const prices = points.map((point) => parseFloat(point[2]));
      const sortedPrices = [...prices].sort((a, b) => a - b);
      const n_1 = sortedPrices[sortedPrices.length - 2];
      const n_2 =
        prices[prices.length - 1] + (n_1 - prices[prices.length - 1]) / 2;
      const n_3 = n_1 + (n_2 - n_1) / 4;

      const predictions = [
        { Timestamp: "Predicted-n+1", "Stock Price": n_1 },
        { Timestamp: "Predicted-n+2", "Stock Price": n_2 },
        { Timestamp: "Predicted-n+3", "Stock Price": n_3 },
      ];

      const csvWriter = createCsvWriter({
        path: path.join(outputDir, `${stockId}_predictions.csv`),
        header: [
          { id: "Timestamp", title: "Timestamp" },
          { id: "Stock Price", title: "Stock Price" },
        ],
      });

      csvWriter
        .writeRecords(predictions)
        .then(() => {
          csvFiles.push(`${stockId}_predictions.csv`);
          if (csvFiles.length === dataPoints.length) {
            res.json({ "CSV Files": csvFiles });
          }
        })
        .catch((err) => {
          console.error("Error writing CSV file:", err);
          res.status(500).json({ error: "Error writing CSV file" });
        });
    });
  });
});

// Start server
app.listen(port, host, async (err) => {
  if (err) {
    console.error(`Failed to start server on port ${port}`)
    return console.error(err.message);
  }

  console.log(`Server started and running on port ${port}`);
});
