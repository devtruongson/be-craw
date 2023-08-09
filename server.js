const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

let failedRequests = []; // Mảng để lưu số yêu cầu không thành công

app.get("/proxy", async (req, res) => {
    try {
        const imageUrl = req.query.url;
        const response = await axios.get(imageUrl, {
            responseType: "arraybuffer",
        });

        res.set("Content-Type", "image/jpeg");
        res.send(response.data);
    } catch (error) {
        console.error(error);

        // Lấy số từ query parameters
        const requestNumber = parseInt(req.query.number);
        // Thêm số yêu cầu không thành công vào mảng
        failedRequests.push(requestNumber);
        res.status(200).send("Internal Server Error");
    }
});

app.get("/retry-failed-requests", async (req, res) => {
    const successNumbers = [];
    const failedNumbers = failedRequests.slice(); // Tạo bản sao của mảng để tránh thay đổi nguyên mẫu

    for (const number of failedNumbers) {
        const imageUrl = `http://a/${number.toString().padStart(3, "0")}.jpg`;
        try {
            const response = await axios.get(
                `/proxy?url=${imageUrl}&number=${number}`,
                {
                    responseType: "arraybuffer",
                }
            );
            successNumbers.push(number);
        } catch (error) {
            console.error(`Request ${number} still failed`);
        }
    }

    // Loại bỏ các yêu cầu thành công khỏi mảng failedRequests
    failedRequests = failedRequests.filter(
        (number) => !successNumbers.includes(number)
    );

    res.json({
        success: successNumbers,
        failed: failedNumbers,
    });
});

app.listen(port, () => {
    console.log(`Proxy server is running on port ${port}`);
});
