var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");

//middleware
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));  //ORDER????
app.use(cookieParser());

function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.end("Hello!");
});

//new add for view the template OK
app.get("/urls", (req, res) => {
  // console.log('/urls get:')
  let templateVars = { 
      urls: urlDatabase,
      username: req.cookies["username"]
    };  
  // console.log(templateVars)
  res.render("urls_index", templateVars);
});

//2nd route post
app.get("/urls/new", (req, res) => {
  console.log("get: ")
    let templateVars = { 
      username: req.cookies["username"]
    };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  // console.log("post:")
  var generateFun = generateRandomString();
  urlDatabase[generateFun] = req.body.longURL;
  // console.log('newURL', req.body);
  // console.log('newURL', req.body.longURL);
  // console.log(urlDatabase);
  // console.log("redirect:")
  res.redirect("urls/" + generateFun);
});

app.get("/u/:shortURL", (req, res) => {
  // console.log("/u/get:")
  // console.log(req.params);

  let longURL = urlDatabase[req.params.shortURL];

  // console.log('database', urlDatabase)
  // console.log(longURL)
  res.redirect(longURL);
});

//new add for shortened form 
app.get("/urls/:id", (req, res) => {
  // console.log("url/ID")
  // console.log(req.params)

  let templateVars = {
    shortURL: req.params.id, //req.params = {id(from:id): "2222"} 2222
    longURL: urlDatabase[req.params.id], //yahoo.com
    username: req.cookies["username"]
  };
  // console.log(templateVars);
  res.render("urls_show", templateVars); //show the data into urls_show
});


//delete a shortURL
app.post("/urls/:id/delete", (req, res) => {
  // console.log("delete")
  // console.log(req.params)
  var deleteshortURL = req.params.id;
  delete urlDatabase[deleteshortURL];
  res.redirect("/urls");
});


//update URL
app.post("/urls/:id", (req, res) => {
  // console.log("update")
  // console.log("params:", req.params)
  // console.log("body:", req.body)
    let templateVars = { 
      username: req.cookies["username"],
    };  
  var updateURL = req.params.id;
  urlDatabase[updateURL] = req.body.shortURL;
  // console.log(updateURL);
  res.redirect("/urls");
});

app.post("/login", (req, res) => { //null
  res.cookie("username", req.body.username)
  res.redirect("/urls");
});

app.post("/logout", (req, res) => { 
  res.clearCookie("username", req.body.username)
  res.redirect("/urls");
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});