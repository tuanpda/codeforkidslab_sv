const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { pool } = require("../database/dbinfo");
const jwt = require("jsonwebtoken");
const verifyToken = require("../services/verify-token");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// SET STORAGE
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    /* Nhớ sửa đường dẫn khi deploy lên máy chủ */
    // đường dẫn cho máy home
    // cb(null, "D:\\CODE\\TCDVTHU\\client\\static\\avatar");
    // đường dẫn máy cơ quan
    // cb(null, "D:\\PROJECT\\TCDVTHU\\client\\static\\avatar");
    // đường dẫn khi deploy máy chủ
    cb(null, "C:\\TCDVTHU\\client\\static\\avatar");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

var upload = multer({ storage: storage });

/* Login user auth */
router.post("/access/login", async (req, res, next) => {
  console.log(req.body);

  const username = req.body.username;
  const password = req.body.password;
  try {
    await pool.connect();
    const result = await pool
      .request()
      .input("username", username)
      .query(`SELECT * FROM users WHERE username = @username`);
    const user = result.recordset[0];
    console.log(user);

    if (!user) {
      res.status(403).json({
        success: 9,
        message: "Authenticate failed, not found user",
      });
    } else {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        if (user.active !== true) {
          res.status(403).json({
            success: 4,
            message: "Authenticate failed, not active user",
          });
        } else {
          let token = jwt.sign(user, process.env.SECRET, { expiresIn: "12h" });
          res.json({ success: 8, user, token });
          //console.log(user);
        }
      } else {
        res.status(403).json({
          success: 7,
          message: "Authenticate failed, wrong password",
        });
      }
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

/* Get email */
router.get("/findemail", async (req, res) => {
  try {
    await pool.connect();
    const result = await pool
      .request()
      .input("email", req.query.email)
      .query(`SELECT * FROM users WHERE email = @email`);
    const email = result.recordset;
    res.json(email);
  } catch (error) {
    res.status(500).json(error);
  }
});

// kích hoạt user with email
router.post("/active/user", async (req, res) => {
  // console.log(req.body);
  try {
    await pool.connect();
    const result = await pool
      .request()
      .input("email", req.body.email)
      .query(`SELECT * FROM users WHERE email = @email`);
    const user = result.recordset[0];
    // console.log(user);
    if (user) {
      await pool
        .request()
        .input("email", user.email)
        .query(
          `UPDATE users SET
                  active = 1
              WHERE email = @email;`
        );
    }
    res.json({
      success: true,
      message: "actived success !",
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

router.post("/precallresetpass", async (req, res) => {
  console.log(req.body);
  // const password = req.body.password;
  // const newPassword = req.body.newPassword;

  try {
    await pool.connect();
    const result = await pool
      .request()
      .input("email", req.body.email)
      .input("sodienthoai", req.body.sodienthoai)
      .input("cccd", req.body.cccd)
      .query(
        `SELECT * FROM users WHERE email = @email and sodienthoai=@sodienthoai and cccd=@cccd`
      );
    let user = result.recordset[0];
    // console.log(user);
    if (user) {
      res.json({
        success: true,
      });
    } else {
      res.json({
        success: false,
      });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

router.post("/callresetpass", async (req, res) => {
  // console.log(req.body.sodienthoai);
  // const password = req.body.password;
  // const newPassword = req.body.newPassword;

  try {
    await pool.connect();
    const result = await pool
      .request()
      .input("email", req.body.email)
      .input("sodienthoai", req.body.sodienthoai)
      .input("cccd", req.body.cccd)
      .query(
        `SELECT * FROM users WHERE email = @email and sodienthoai=@sodienthoai and cccd=@cccd`
      );
    let user = result.recordset[0];
    // console.log(user);
    if (user) {
      const newPassword = `${user.cccd}${Math.floor(
        100000 + Math.random() * 900000
      )}`;

      const encryptedPassword = await bcrypt.hash(newPassword, 10);
      console.log(encryptedPassword);

      await pool
        .request()
        .input("_id", user._id)
        .input("password", encryptedPassword)
        .query(
          `UPDATE users SET
            password = @password
          WHERE _id = @_id;`
        );
      res.json({
        success: true,
        message: "reset success !",
        newPassword,
      });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;
