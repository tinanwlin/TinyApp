var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");

//middleware
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));  //ORDER????
app.use(cookieParser());

//function helper
function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function checkExistingEmail(email) {
  var check = false;
  for (var key in users) {
    if (users[key].email === email) {
      check = true;
      break;
    }
  }
  return check;
}
// a new database with {short: sss, long:ddd, userID: (=ID)}
var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "apple": {
    id: "apple",
    email: "apple@example.com",
    password: "red-monkey-dinosaur"
  },
  "banana": {
    id: "banana",
    email: "banana@example.com",
    password: "yellow-cat"
  }
};


app.get("/", (req, res) => {
  res.end("Hello!");
});

// app.get("json)????



app.get("/urls", (req, res) => {
  let templateVars;
  if (req.cookies.user_id) {
    templateVars = {
      urls: urlDatabase,
      user: users[req.cookies.user_id] 
    };
  } else {
    templateVars = {
      urls: urlDatabase,
      user: false
    }
  }
  res.render("urls_index", templateVars);
});

//2nd route post
app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.cookies.user_id]
  };
  res.render("urls_new", templateVars);//+++UNDEFINDED
});

app.post("/urls", (req, res) => {
  var generateFun = generateRandomString();
  urlDatabase[generateFun] = req.body.longURL;
  res.redirect("urls/" + generateFun);
});


app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  if (!longURL) {
    res.send(404, "Not Found")
  } else {
    res.redirect(longURL);
  }
});

//delete a shortURL
app.post("/urls/:id/delete", (req, res) => {
  var deleteshortURL = req.params.id;
  delete urlDatabase[deleteshortURL];
  res.redirect("/urls");
});


//new add for shortened form 
app.get("/urls/:id", (req, res) => {
  if (req.cookies.user_id) {
    let templateVars = {
      shortURL: req.params.id, //req.params = {id(from:id): "2222"} 2222
      longURL: urlDatabase[req.params.id], //yahoo.com
      user: users[req.cookies.user_id]//++++UNDEFINED
    };
    res.render("urls_show", templateVars); //show the data into urls_show
  } else {
    res.redirect("/register") //???????
  }
});

//update URL
app.post("/urls/:id", (req, res) => {
  let templateVars = {
    user: users[req.cookies.user_id],
  };
  var updateURL = req.params.id;
  urlDatabase[updateURL] = req.body.shortURL;//?????? long short
  res.redirect("/urls");
});

app.get("/login", (req, res) => {

  res.render("urls_login");
})

function authenticateUser(email, password) {
  var isAuthenticated = false;
  var result;
  for (var key in users) {
    if (email === users[key].email && password === password) {
      isAuthenticated = true;
      result = key;
      break;
    }
  }
  if (isAuthenticated) {
    return users[result]
  } else {
    return false;
  }
}

app.post("/login", (req, res) => { //null
  var result = authenticateUser(req.body.useremail, req.body.password);
  if (result) {
    res.cookie("user_id", result.id);
    res.redirect("/urls");
  } else {
    res.send(403, "Incorrect Username or Password");
  }
});


app.post("/logout", (req, res) => {
  res.clearCookie("user_id")//username should be username or ID????
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  res.render("urls_register");
});

app.post("/register", (req, res) => {
  var checkEmailResult = checkExistingEmail(req.body.email);
  if (req.body.email === "" || req.body.password === "") {
    res.send(401, "Unauthorized. Please enter your email and password.");
  }
  if (checkEmailResult) {
    res.send(401, "This email has already registered.");
  } else {
    var newUser = {
      id: generateRandomString(),
      email: req.body.email,
      password: req.body.password
    };
    users[newUser.id] = newUser;
    console.log("register", users)
    console.log("redirect to /urls:")
    res.cookie("user_id", newUser.id);
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});