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

// get all classes
router.get("/get-all-classes", async (req, res) => {
  try {
    await pool.connect();
    const result = await pool
      .request()
      .query(`SELECT * FROM classes order by _id`);
    const classes = result.recordset;
    res.json(classes);
  } catch (error) {
    res.status(500).json(error);
  }
});

// update class
router.post("/class-update", async (req, res) => {
  try {
    await pool.connect();
    const result = await pool
      .request()
      .input("_id", req.body._id)
      .query(`SELECT * FROM classes WHERE _id = @_id`);
    let classes = result.recordset[0];
    // console.log(course);
    if (classes) {
      await pool
        .request()
        .input("_id", req.body._id)
        .input("codecls", req.body.codecls)
        .input("namecls", req.body.namecls)
        .input("createdAt", req.body.createdAt)
        .input("countclss", req.body.countclss)
        .input("codecourse", req.body.codecourse)
        .input("namecourse", req.body.namecourse)
        .query(
          `UPDATE classes SET 
              codecls = @codecls,
              namecls = @namecls,
              createdAt = @createdAt,
              countclss = @countclss,
              codecourse = @codecourse,
              namecourse = @namecourse
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
router.post("/create-class", async (req, res) => {
  console.log(req.body);

  try {
    await pool.connect();
    const result = await pool
      .request()
      .input("codecls", req.body.codecls)
      .input("namecls", req.body.namecls)
      .input("createdAt", req.body.createdAt)
      .input("countclss", req.body.countclss)
      .input("namecourse", req.body.namecourse)
      .input("codecourse", req.body.codecourse).query(`
                INSERT INTO classes (codecls, namecls,
                  createdAt, countclss, namecourse, codecourse)
                VALUES (@codecls, @namecls,
                  @createdAt, @countclss, @namecourse, @codecourse) ;
            `);
    const classes = req.body;
    res.json({
      classes,
      message: "Created success!",
      success: true,
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

// xóa user
router.post("/delete/class", async (req, res) => {
  // console.log(req.body);
  try {
    await pool.connect();
    const result = await pool
      .request()
      .input("_id", req.body._id)
      .query(`SELECT * FROM classes WHERE _id = @_id`);

    let classes = result.recordset.length ? result.recordset[0] : null;
    // console.log(course);
    if (classes) {
      await pool
        .request()
        .input("_id", req.body._id)
        .query(`DELETE FROM classes WHERE _id = @_id;`);
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
