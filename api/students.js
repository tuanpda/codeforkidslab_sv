const express = require("express");
const router = express.Router();
const { pool } = require("../database/dbinfo");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// SET STORAGE
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    /* Nhớ sửa đường dẫn khi deploy lên máy chủ */
    cb(
      null,
      // "/Users/apple/Documents/code/p_Codeforkidslab/frontend_/static/upload/" -- macos
      "E:\\CODE_APP\\CODEFORKIDSLAB\\codeforkidslab\\static\\upload"
    );
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

var upload = multer({ storage: storage });

// get all students
router.get("/get-all-students", async (req, res) => {
  try {
    await pool.connect();
    const result = await pool
      .request()
      .query(`SELECT * FROM students order by _id`);
    const students = result.recordset;
    res.json(students);
  } catch (error) {
    res.status(500).json(error);
  }
});

// update student
router.post("/student-update", upload.single("image"), async (req, res) => {
  // console.log(req.file);
  let linkImage;
  if (!req.file) {
    linkImage = req.body.image;
  } else {
    // linkImage = `http://localhost:1186/upload/${req.file.filename}`;
    linkImage = `http://14.224.129.177:1186/upload/${req.file.filename}`;
  }
  // console.log(linkImage);
  try {
    await pool.connect();
    const result = await pool
      .request()
      .input("_id", req.body._id)
      .query(`SELECT * FROM students WHERE _id = @_id`);
    let student = result.recordset[0];
    // console.log(student);
    if (student) {
      // xóa file ảnh cũ trong thư mục
      if (req.file) {
        const basePath =
          // "/Users/apple/Documents/code/p_Codeforkidslab/frontend_/static/upload/";
          "E:\\CODE_APP\\CODEFORKIDSLAB\\codeforkidslab\\static\\upload";
        const fileName = path.basename(student.image);
        // console.log(fileName);
        // Ghép đường dẫn và tên tệp bằng phương thức path.join()
        const filePath = path.join(basePath, fileName);
        fs.unlink(filePath, (err) => {
          if (err) {
            return;
          }
        });
      }

      await pool
        .request()
        .input("_id", req.body._id)
        .input("username", req.body.username)
        .input("name", req.body.name)
        .input("age", req.body.age)
        .input("school", req.body.school)
        .input("image", linkImage)
        .input("parent", req.body.parent)
        .input("parent_contact", req.body.parent_contact)
        .input("address", req.body.address)
        .input("description", req.body.description)
        .query(
          `UPDATE students SET 
              username = @username,
              name = @name,
              age = @age,
              school = @school,
              image = @image,
              parent = @parent,
              parent_contact = @parent_contact,
              address = @address,
              description = @description
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

// create courses
router.post("/create-student", upload.single("image"), async (req, res) => {
  // console.log(req.file);
  let linkImage;
  if (!req.file) {
    linkImage = req.body.image;
  } else {
    // linkImage = `http://localhost:1186/upload/${req.file.filename}`;
    linkImage = `http://14.224.129.177:1186/upload/${req.file.filename}`;
  }
  try {
    await pool.connect();
    const result = await pool
      .request()
      .input("username", req.body.username)
      .input("name", req.body.name)
      .input("age", req.body.age)
      .input("image", linkImage)
      .input("school", req.body.school)
      .input("parent", req.body.parent)
      .input("parent_contact", req.body.parent_contact)
      .input("address", req.body.address)
      .input("createdAt", req.body.createdAt)
      .input("description", req.body.description).query(`
                INSERT INTO students (username, name, age, image, school, parent, parent_contact, address, createdAt,
                  description)
                VALUES (@username, @name, @age, @image, @school, @parent, @parent_contact, @address, @createdAt,
                  @description) ;
            `);
    const students = req.body;
    res.json({
      students,
      message: "Created success!",
      success: true,
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

// delete
router.post("/delete/student", async (req, res) => {
  // console.log(req.body);
  try {
    await pool.connect();
    const result = await pool
      .request()
      .input("_id", req.body._id)
      .query(`SELECT * FROM students WHERE _id = @_id`);

    let student = result.recordset.length ? result.recordset[0] : null;
    // console.log(course);
    if (student) {
      // xóa file trong thư mục
      if (student.image) {
        const basePath =
          // "/Users/apple/Documents/code/p_Codeforkidslab/frontend_/static/upload/";
          "E:\\CODE_APP\\CODEFORKIDSLAB\\codeforkidslab\\static\\upload";
        const fileName = path.basename(req.body.image);
        // Ghép đường dẫn và tên tệp bằng phương thức path.join()
        const filePath = path.join(basePath, fileName);
        //   console.log(filePath);
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error("Đã xảy ra lỗi khi xóa tệp:", err);
            return;
          }
          // console.log("Tệp đã được xóa thành công");
        });
      }

      await pool
        .request()
        .input("_id", req.body._id)
        .query(`DELETE FROM students WHERE _id = @_id;`);
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
