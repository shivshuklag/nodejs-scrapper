import { default as axios } from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const scrapData = async () => {
  let page = 1;
  let response;
  const output = [];
  while (true) {
    const url = `${process.env.url}?p=${page}`;
    console.log("Current Page: ", page);
    console.log({ url });

    try {
      response = await axios.get(url, { timeout: 30000 });
    } catch (e) {
      console.log("Reached to the end of page: ", page - 1);
      break;
    }
    const $ = cheerio.load(response?.data);
    const inputText = $("body").text();
    const items = inputText
      .split(/\d+\.\s/)
      .filter((item) => item.trim() !== "");

    for (let i = 1; i < items.length - 2; i++) {
      const item = items[i]?.split("\n");
      const otherData = item[1]?.split("|");

      const temp = {
        title: item[0].trim(),
        points: otherData[0]?.trim(),
        comments: !isNaN(parseInt(otherData[2]?.trim().split(/(\s+)/)[0]))
          ? Number(otherData[2]?.trim().split(/(\s+)/)[0])
          : 0,
      };
      output.push(temp);
    }

    page += 1;
  }
  await formatData(output);
};

const formatData = async (output) => {
  const outputData = {};

  output.forEach((item) => {
    const comments = item?.comments;
    const commentRange = Math.floor(comments / 100) * 100;

    if (!outputData[commentRange]) {
      outputData[commentRange] = [];
    }

    outputData[commentRange].push(item);
  });

  const result = Object.keys(outputData).map((commentRange) => ({
    [`${commentRange}-${parseInt(commentRange) + 100} comments`]:
      outputData[commentRange],
  }));

  const finalResponse = JSON.stringify(result, null, 2);
  const fileName = process.env.outputFile + ".json";

  fs.writeFile(fileName, finalResponse, "utf-8", (err) => {
    if (err) {
      console.error("Error writing to file:", err);
    } else {
      console.log(`Data written to ${fileName}`);
    }
  });
};

// async function fetchDataWithRetry(url, maxRetries = 3, retryDelay = 5000) {
//   let retries = 0;
//   while (retries < maxRetries) {
//     try {
//       const response = await axios.get(url, {
//         timeout: 10000,
//       });
//       return response.data;
//     } catch (error) {
//       if (error.code === "ERR_SOCKET_CONNECTION_TIMEOUT") {
//         console.log("Retrying...");
//       } else {
//         console.log("Error:", error.message);
//         break;
//       }
//     }
//     retries++;
//     await new Promise((resolve) => setTimeout(resolve, retryDelay));
//   }
//   console.log("Reached maximum number of retries.");
//   return null;
// }

scrapData();
