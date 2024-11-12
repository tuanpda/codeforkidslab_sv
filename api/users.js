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
    // cb(null, "C:\\TCDVTHU\\client\\static\\avatar");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

var upload = multer({ storage: storage });

/* Get all users */
router.get("/", async (req, res) => {
  try {
    await pool.connect();
    const result = await pool
      .request()
      .query(`SELECT * FROM users order by createdAt desc`);
    const users = result.recordset;
    res.json(users);
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

/* Get user by id */
router.get("/:_id", async (req, res) => {
  try {
    await pool.connect();
    const result = await pool
      .request()
      .input("_id", req.params._id)
      .query(`SELECT * FROM users WHERE _id = @_id`);
    const user = result.recordset[0];
    if (!user) {
      res.status(403).json({
        success: false,
        message: "Authenticate failed, not found user",
      });
    } else {
      res.json(user);
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

/* Cập nhật 1 user thường không qua auth */
router.patch("/user/:_id", upload.single("avatar"), async (req, res) => {
  let linkAvatar;
  if (!req.file) {
    linkAvatar = req.body.avatar;
  } else {
    linkAvatar = `http://ansinhbhxh.online/avatar/${req.file.filename}`;
  }
  try {
    await pool.connect();
    const result = await pool
      .request()
      .input("_id", req.params._id)
      .query(`SELECT * FROM users WHERE _id = @_id`);
    let user = result.recordset[0];
    if (user) {
      if (req.body.email) user.email = req.body.email;
      if (req.body.username) user.username = req.body.username;
      if (req.body.name) user.name = req.body.name;
      if (req.body.password) {
        var password = req.body.password;
        const encryptedPassword = await bcrypt.hash(password, 10);
        user.password = encryptedPassword;
      }
      if (req.body.role) user.role = req.body.role;
      if (req.body.mahuyen) user.mahuyen = req.body.mahuyen;
      await pool
        .request()
        .input("_id", req.params._id)
        .input("email", user.email)
        .input("username", user.username)
        .input("name", user.name)
        .input("password", user.password)
        .input("updatedAt", req.body.updatedAt)
        .input("avatar", linkAvatar)
        .input("role", user.role)
        .input("mahuyen", user.mahuyen)
        .query(
          `UPDATE users SET 
              email = @email, 
              password = @password, 
              username = @username, 
              name = @name,
              updatedAt = @updatedAt,
              avatar = @avatar,
              role = @role,
              mahuyen = @mahuyen
          WHERE _id = @_id;`
        );
      res.json({
        success: true,
        message: "Update success !",
      });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// cập nhật thông tin người dùng
router.post("/user/fix", upload.single("avatar"), async (req, res) => {
  let linkAvatar;
  // console.log(req.body);
  if (!req.file) {
    linkAvatar = req.body.avatar;
  } else {
    // xóa file ảnh cũ
    const basePath = "C:\\TCDVTHU\\client\\static\\avatar";
    // "D:\\PROJECT\\TCDVTHU\\client\\static\\avatar"; // đổi đường dẫn khi up lên máy chủ
    const fileName = path.basename(req.body.avatarOld);
    // console.log(fileName);
    // Ghép đường dẫn và tên tệp bằng phương thức path.join()
    const filePath = path.join(basePath, fileName);
    // console.log(filePath);
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("error", err);
        return;
      }
    });
    linkAvatar = `http://localhost:1186/avatar/${req.file.filename}`;
  }
  try {
    await pool.connect();
    const result = await pool
      .request()
      .input("_id", req.body._id)
      .query(`SELECT * FROM users WHERE _id = @_id`);
    let user = result.recordset[0];
    // console.log(user);
    if (user) {
      await pool
        .request()
        .input("_id", req.body._id)
        .input("diachi", req.body.diachi)
        .input("cccd", req.body.cccd)
        .input("sodienthoai", req.body.sodienthoai)
        .input("email", req.body.email)
        .input("name", req.body.name)
        .input("avatar", linkAvatar)
        .input("active", req.body.active)
        .input("updatedAt", req.body.updatedAt)
        .input("updatedBy", req.body.updatedBy)
        .input("ghichu", req.body.ghichu)
        .query(
          `UPDATE users SET 
              diachi = @diachi,
              cccd = @cccd,
              sodienthoai = @sodienthoai,
              email = @email, 
              name = @name,
              avatar = @avatar,
              active = @active,
              updatedAt = @updatedAt,
              updatedBy = @updatedBy,
              ghichu = @ghichu
          WHERE _id = @_id;`
        );
      res.json({
        success: true,
        message: "Update success !",
      });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// Đổi mật khẩu và email
router.post("/user/changepass", async (req, res) => {
  // console.log(req.body);
  const password = req.body.password;
  const newPassword = req.body.newPassword;
  try {
    await pool.connect();
    const result = await pool
      .request()
      .input("_id", req.body._id)
      .query(`SELECT * FROM users WHERE _id = @_id`);
    let user = result.recordset[0];
    // console.log(user);
    if (user && req.body.password) {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        const encryptedPassword = await bcrypt.hash(newPassword, 10);

        await pool
          .request()
          .input("_id", req.body._id)
          .input("password", encryptedPassword)
          .input("email", req.body.email)
          .query(
            `UPDATE users SET
            password = @password,
            email = @email
          WHERE _id = @_id;`
          );
        res.json({
          success: true,
          message: "Update success !",
        });
      } else {
        res.json({
          success: 5,
          message: "Sai pass !",
        });
      }
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// Đổi Email
router.post("/user/changeemail", async (req, res) => {
  // console.log(req.body);
  try {
    await pool.connect();
    const result = await pool
      .request()
      .input("_id", req.body._id)
      .query(`SELECT * FROM users WHERE _id = @_id`);
    let user = result.recordset[0];
    // console.log(user);
    if (user) {
      await pool
        .request()
        .input("_id", req.body._id)
        .input("email", req.body.email)
        .query(
          `UPDATE users SET 
              email = @email
          WHERE _id = @_id;`
        );
      res.json({
        success: true,
        message: "Update success !",
      });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// Cập nhật thông tin người dùng
router.post("/user/updateinfo", async (req, res) => {
  // console.log(req.body);
  try {
    await pool.connect();
    const result = await pool
      .request()
      .input("_id", req.body._id)
      .query(`SELECT * FROM users WHERE _id = @_id`);
    let user = result.recordset[0];
    // console.log(user);
    if (user) {
      await pool
        .request()
        .input("_id", req.body._id)
        .input("email", req.body.email)
        .input("name", req.body.name)
        .input("sodienthoai", req.body.sodienthoai)
        .input("matochuc", req.body.matochuc)
        .input("tentochuc", req.body.tentochuc)
        .input("diachi", req.body.diachi)
        .query(
          `UPDATE users SET 
              email = @email,
              name = @name,
              sodienthoai = @sodienthoai,
              matochuc = @matochuc,
              tentochuc = @tentochuc,
              diachi = @diachi
          WHERE _id = @_id;`
        );
      res.json({
        success: true,
        message: "Update success !",
      });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

/* Lấy 1 user auth */
router.get("/auth/user", verifyToken, async (req, res) => {
  // console.log(req.decoded)
  // console.log(req.decoded._id)
  const _id = req.decoded._id;
  try {
    await pool.connect();
    const result = await pool
      .request()
      .query(`SELECT * FROM users WHERE _id = ${_id}`);
    const user = result.recordset[0];
    if (!user) {
      res.status(403).json({
        success: false,
        message: "Authenticate failed, not found user",
      });
    } else {
      res.json(user);
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

/* Login user auth */
router.post("/auth/login", async (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;
  try {
    await pool.connect();
    const result = await pool
      .request()
      .input("username", username)
      .query(`SELECT * FROM users WHERE username = @username`);
    const user = result.recordset[0];
    if (!user) {
      res.status(403).json({
        success: 9,
        message: "Authenticate failed, not found user",
      });
    } else {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        let token = jwt.sign(user, process.env.SECRET, { expiresIn: "1h" });
        res.json({ success: 8, user, token });
        //console.log(user);
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

/* Tạo user auth kèm token */
router.post("/account", upload.single("avatar"), async (req, res) => {
  console.log(req.body);
  var password = req.body.password;
  const encryptedPassword = await bcrypt.hash(password, 10);

  let linkAvatar;
  const file = req.file;
  if (!file) {
    linkAvatar = req.body.avatar;
  } else {
    // Đổi đường dẫn khi deploy lên máy chủ
    linkAvatar = `./${req.file.filename}`;
  }
  try {
    await pool.connect();
    const result = await pool
      .request()
      .input("matochuc", req.body.matochuc)
      .input("tentochuc", req.body.tentochuc)
      .input("diachi", req.body.diachi)
      .input("cccd", req.body.cccd)
      .input("sodienthoai", req.body.sodienthoai)
      .input("email", req.body.email)
      .input("username", req.body.username)
      .input("name", req.body.name)
      .input("password", encryptedPassword)
      .input("role", req.body.role)
      .input("avatar", linkAvatar)
      .input("active", req.body.active)
      .input("createdBy", req.body.createdBy)
      .input("createdAt", req.body.createdAt)
      .input("updatedBy", req.body.updatedBy)
      .input("updatedAt", req.body.updatedAt).query(`
                INSERT INTO users (matochuc, tentochuc,
                  diachi, cccd, sodienthoai, email, username, name, password, role, avatar, active, 
                  createdBy, createdAt, updatedBy, updatedAt) 
                VALUES (@matochuc, @tentochuc,
                  @diachi, @cccd, @sodienthoai, @email, @username, @name, @password, @role, @avatar, @active,
                  @createdBy, @createdAt, @updatedBy, @updatedAt);
            `);
    const user = req.body;
    let token = jwt.sign({ user }, process.env.SECRET, { expiresIn: "1h" });
    res.json({ user, token, message: "Create user success!", success: true });
  } catch (error) {
    res.status(500).json(error);
  }
});

// cập nhật thông tin user auth
router.patch("/auth/user", verifyToken, async (req, res) => {
  const _id = req.decoded._id;
  try {
    await pool.connect();
    const result = await pool
      .request()
      .query(`SELECT * FROM users WHERE _id = ${_id}`);
    let user = result.recordset[0];
    //console.log(user.email);
    if (user) {
      if (req.body.email) user.email = req.body.email;
      if (req.body.username) user.username = req.body.username;
      if (req.body.name) user.name = req.body.name;
      if (req.body.password) {
        var password = req.body.password;
        const encryptedPassword = await bcrypt.hash(password, 10);
        user.password = encryptedPassword;
      }
      await pool
        .request()
        .input("_id", _id)
        .input("email", user.email)
        .input("username", user.username)
        .input("name", user.name)
        .input("password", user.password)
        .input("updatedAt", req.body.updatedAt)
        .query(
          `UPDATE users SET 
              email = @email, 
              password = @password, 
              username = @username, 
              name = @name,
              updatedAt = @updatedAt
          WHERE _id = ${_id};`
        );
      res.json({
        success: true,
        message: "Update success !",
      });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

/* Xóa dữ liệu */
router.delete("/:_id", async (req, res) => {
  try {
    await pool.connect();
    const result = await pool
      .request()
      .input("_id", req.params._id)
      .query(`SELECT * FROM users WHERE _id = @_id`);
    let user = result.recordset.length ? result.recordset[0] : null;
    if (user) {
      await pool
        .request()
        .input("_id", req.params._id)
        .query(`DELETE FROM users WHERE _id = @_id;`);
      res.json(user);
    } else {
      res.status(404).json({
        message: "Không tìm thấy user này",
      });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// xóa user
router.post("/delete/user", async (req, res) => {
  // console.log(req.body);
  try {
    await pool.connect();
    const result = await pool
      .request()
      .input("_id", req.body._id)
      .query(`SELECT * FROM users WHERE _id = @_id`);

    let user = result.recordset.length ? result.recordset[0] : null;
    // console.log(user);
    if (user) {
      // xóa file trong thư mục
      const basePath = "C:\\TCDVTHU\\client\\static\\avatar";
      // "D:\\PROJECT\\TCDVTHU\\client\\static\\avatar"; // đổi đường dẫn khi up lên máy chủ
      const fileName = path.basename(req.body.avatar);
      // Ghép đường dẫn và tên tệp bằng phương thức path.join()
      const filePath = path.join(basePath, fileName);
      //   console.log(filePath);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Đã xảy ra lỗi khi xóa tệp:", err);
          return;
        }
        console.log("Tệp đã được xóa thành công");
      });
      await pool
        .request()
        .input("_id", req.body._id)
        .query(`DELETE FROM users WHERE _id = @_id;`);
      res.json({ success: true });
    } else {
      res.status(404).json({
        message: "Record not found",
      });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;
