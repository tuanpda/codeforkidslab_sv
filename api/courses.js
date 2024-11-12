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
    // đường dẫn cho máy home
    cb(
      null,
      "/Users/apple/Documents/code/p_Codeforkidslab/frontend_/static/upload/"
    );
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

var upload = multer({ storage: storage });

// get all courses
router.get("/get-all-courses", async (req, res) => {
  try {
    await pool.connect();
    const result = await pool
      .request()
      .query(`SELECT * FROM courses order by _id`);
    const courses = result.recordset;
    res.json(courses);
  } catch (error) {
    res.status(500).json(error);
  }
});

// update course
router.post("/course-update", upload.single("img"), async (req, res) => {
  // console.log(req.body);
  let linkImage;
  if (!req.file) {
    linkImage = req.body.img;
  } else {
    linkImage = `http://localhost:1186/upload/${req.file.filename}`;
  }

  try {
    await pool.connect();
    const result = await pool
      .request()
      .input("_id", req.body._id)
      .query(`SELECT * FROM courses WHERE _id = @_id`);
    let course = result.recordset[0];
    // console.log(course);
    if (course) {
      // xóa file ảnh cũ trong thư mục
      const basePath =
        "/Users/apple/Documents/code/p_Codeforkidslab/frontend_/static/upload/";
      const fileName = path.basename(course.img);
      // Ghép đường dẫn và tên tệp bằng phương thức path.join()
      const filePath = path.join(basePath, fileName);
      fs.unlink(filePath, (err) => {
        if (err) {
          return;
        }
      });

      await pool
        .request()
        .input("_id", req.body._id)
        .input("codecourse", req.body.codecourse)
        .input("namecourse", req.body.namecourse)
        .input("description", req.body.description)
        .input("teachers", req.body.teachers)
        .input("img", linkImage)
        .input("numberofless", req.body.numberofless)
        .input("price", req.body.price)
        .query(
          `UPDATE courses SET 
              codecourse = @codecourse,
              namecourse = @namecourse,
              description = @description,
              teachers = @teachers,
              img = @img,
              numberofless = @numberofless,
              price = @price
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
router.post("/create-course", upload.single("img"), async (req, res) => {
  let linkImage;
  if (!req.file) {
    linkImage = req.body.img;
  } else {
    linkImage = `http://localhost:1186/upload/${req.file.filename}`;
  }
  try {
    await pool.connect();
    const result = await pool
      .request()
      .input("codecourse", req.body.codecourse)
      .input("namecourse", req.body.namecourse)
      .input("description", req.body.description)
      .input("teachers", req.body.teachers)
      .input("img", linkImage)
      .input("createdAt", req.body.createdAt)
      .input("numberofless", req.body.numberofless)
      .input("price", req.body.price).query(`
                INSERT INTO courses (codecourse, namecourse,
                  description, teachers, img, createdAt, numberofless, price)
                VALUES (@codecourse, @namecourse,
                  @description, @teachers, @img, @createdAt, @numberofless, @price) ;
            `);
    const courses = req.body;
    res.json({
      courses,
      message: "Created success!",
      success: true,
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

// xóa
router.post("/delete/course", async (req, res) => {
  // console.log(req.body);
  try {
    await pool.connect();
    const result = await pool
      .request()
      .input("_id", req.body._id)
      .query(`SELECT * FROM courses WHERE _id = @_id`);

    let course = result.recordset.length ? result.recordset[0] : null;
    // console.log(course);
    if (course) {
      // xóa file trong thư mục
      const basePath =
        "/Users/apple/Documents/code/p_Codeforkidslab/frontend_/static/upload/";
      const fileName = path.basename(req.body.img);
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
        .query(`DELETE FROM courses WHERE _id = @_id;`);
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
