require("dotenv").config();
console.log("Password from env:", process.env.DB_PASSWORD);



const { faker } = require("@faker-js/faker");
const mysql = require("mysql2");
const dotenv = require('dotenv');
dotenv.config();

const { v4: uuidv4 } = require('uuid');

const express = require("express");
const app = express();

const methodOverride = require("method-override");
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));

const path = require("path");
app.set("views engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(path.join(__dirname, "public")));


const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
connection.connect((err) => {
  if (err) {
    console.error('Connection failed:', err);
  } else {
    console.log('Connected to DB ✅');
  }
});

module.exports = connection;
let getRandomUser = () => {
  return [
    faker.string.uuid(),
    faker.internet.username(), // before version 9.1.0, use userName()
    faker.internet.email(),
    faker.internet.password(),
  ];
};

// home page
app.get("/", (req, res) => {
  let q = `select count(*) from user`;
  try {
    connection.query(q, (err, result) => {
      if (err) throw err;
      let count = result[0]["count(*)"];
      res.render("home.ejs", { count });
    });
  } catch (err) {
    console.log(err);
    res.send("some error in db");
  }
});

// create new user
app.get("/user/new",(req,res)=>{
  res.render("new.ejs");
});
app.post("/user",(req,res)=>{
  let { email , username,password}=req.body;
  let id = uuidv4();

    let q = `INSERT INTO user (id, email, username, password) VALUES (?, ?, ?, ?)`;
     connection.query(q, [id, email, username, password], (err, result) => {
    if (err) {
      console.log(err);
       return res.redirect("/user?status=addfail");
    } else {
       res.redirect("/user?status=added");
    }
  });
});

//  show route
app.get("/user", (req, res) => {
  let q = `SELECT * FROM user`;
  try {
    connection.query(q, (err, users) => {
      if (err) throw err;

      res.render("showuser.ejs", { users });
    });
  } catch (err) {
    console.log(err);
    res.send("some error in db");
  }
});

// edit route
app.get("/user/:id/edit", (req, res) => {
  let { id } = req.params;
  let q = `SELECT * FROM user WHERE id= '${id}'`;
  try {
    connection.query(q, (err, result) => {
      if (err) throw err;
      let user = result[0];
      res.render("edit.ejs", { user });
    });
  } catch (err) {
    console.log(err);
    res.send("some error in db");
  }
});

// UPDATE
app.patch("/user/:id", (req, res) => {
  let { id } = req.params;
  let {password: formPass,username:newUsername}=req.body;
  let q = `SELECT * FROM user WHERE id= '${id}'`;
  try {
    connection.query(q, (err, result) => {
      if (err) throw err;
      let user = result[0];
      if(formPass != user.password){
        res.send("wrong password");
      }else{
        let q2=`update user set username='${newUsername}' where id ='${id}'`;
        connection.query(q2,(err,result)=>{
            if(err) throw err;
            res.redirect("/user");
        });
    }
    });
  } catch (err) {
    console.log(err);
    res.send("some error in db");
  }
});



// delete
app.get("/user/:id/delete",(req,res)=>{
  let { id } = req.params;
  res.render("delete.ejs",{id});
});
app.delete("/user/:id", (req, res) => {
  let { id } = req.params;
  let { email, password } = req.body;
  let q = `SELECT * FROM user WHERE id = ?`;
  connection.query(q, [id], (err, result) => {
    if (err) return res.send("DB error");

    let user = result[0];

    // Check if email + password match
    if (user && user.email === email && user.password === password) {
      const deleteQuery = `DELETE FROM user WHERE id = ?`;
      connection.query(deleteQuery, [id], (err, result) => {
        if (err) return res.send("Error deleting user");

        res.redirect("/user?status=success");
      });
    } else {
      res.redirect("/user?status=fail");
    }
  });
});

app.listen("8080", () => {
  console.log("server is listening to port 8080");
});
