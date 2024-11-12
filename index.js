const bodyParse = require("body-parser");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const verifyToken = require("./services/verify-token");
const path = require("path");

const app = express();
dotenv.config();

app.use(cors());
app.use(morgan("dev"));
app.use(bodyParse.urlencoded({ extended: false }));
app.use(bodyParse.json());

const staticFilesDirectory = path.join(__dirname, "public");
app.use(express.static(staticFilesDirectory));

// Tăng giới hạn kích thước thực thể lên 50MB
app.use(bodyParse.json({ limit: "50mb" }));
app.use(bodyParse.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/auth", require("./api/auth"));

// Middleware xác thực chỉ áp dụng cho các endpoint cần được bảo vệ
app.use(["/", "/api", "/api/users"], verifyToken);

app.get("/", (req, res) => {
  res.send("<h1>🤖 API SV</h1>");
});

app.use("/api/users", require("./api/users"));
app.use("/api/courses", require("./api/courses"));
app.use("/api/classes", require("./api/classes"));
app.use("/api/students", require("./api/students"));

app.listen(process.env.PORT, () => {
  const port = process.env.PORT;

  // Kiểm tra đơn giản để đảm bảo rằng giá trị port là một số
  if (process.env.NODE_ENV !== "production") {
    if (!isNaN(port)) {
      console.log(`Server đang chạy trên cổng ${port}`);
    } else {
      console.log("Số cổng không hợp lệ");
    }
  }
});
