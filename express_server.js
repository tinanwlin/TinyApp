var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var bcrypt = require('bcrypt');


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

function urlsForUser(id) {
  var result = false;
  for (var key in urlDatabase) {
    if (id === key) {
      result = true;
    }
  }
  return result;
}
// a new database with {short: sss, long:ddd, userID: (=ID)}

var urlDatabase = {
  "orange": {
    "b2xVn2": "http://www.lighthouselabs.ca",

  },
  "banana": {
    "9sm5xK": "http://www.facebook.ca",
  }
};

var users = {
  "orange": {
    id: "orange",
    email: "orange@example.com",
    password: bcrypt.hashSync("orange-monkey-dinosaur", 10)
  },
  "banana": {
    id: "banana",
    email: "banana@example.com",
    password: bcrypt.hashSync("123", 10)
  }
};


app.get("/", (req, res) => {//urls & login



  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/urls", (req, res) => { 
  let templateVars = {
    urls: [],
    user: null
  };
  if (req.cookies.user_id) {
    templateVars = {
      urls: urlDatabase[req.cookies.user_id],
      user: users[req.cookies.user_id]
    };
  }

  res.render("urls_index", templateVars);
});

//2nd route post
app.get("/urls/new", (req, res) => { //if statement if the user id match???
  let templateVars = {
    user: users[req.cookies.user_id]
  };
  res.render("urls_new", templateVars);//+++UNDEFINDED
});

app.post("/urls", (req, res) => {
  var generateFun = generateRandomString();
  if (urlsForUser(req.cookies.user_id)) {
    urlDatabase[req.cookies.user_id][generateFun] = req.body.longURL;
  };
  console.log("the function find user:", urlsForUser(req.cookies.user_id))
  console.log("/urls: cookiesID", req.cookies.user_id)
  console.log("urlDatabase:", urlDatabase)
  res.redirect("/urls/" + generateFun);
});


app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  if (!longURL) {
    res.status(404);
    res.send("Not Found");
  } else {
    res.redirect(longURL);
  }
});

//delete a shortURL
app.get("/urls/:id/delete", (req, res) => {
  var deleteshortURL = req.params.id;
  delete urlDatabase[deleteshortURL];
  res.redirect("/urls");
});


//new add for shortened form 
app.get("/urls/:id", (req, res) => {
  if (req.cookies.user_id) {
    var templateVars = {
      shortURL: req.params.id,
      user: users[req.cookies.user_id]
    }
    // var shortURL = req.params.id;
    // if (urlsForUser(req.cookies.user_id)) {
    // urlDatabase[req.cookies.user_id][shortURL] = urlDatabase[req.params.id],
    res.render("urls_show", templateVars);
  } else {
    // console.log("cookieID:", req.cookies.user_id)
    // console.log("shortURL:", shortURL)
    // console.log("urlDatabase:", urlDatabase)
    res.redirect("/register") //???????
  }
});

//update URL
app.post("/urls/:id", (req, res) => {
  // let templateVars = {
  //   user: users[req.cookies.user_id],
  // };

  var shortURL = req.params.id;
  urlDatabase[req.cookies.user_id][shortURL] = req.body.longURL;
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  res.render("urls_login");
})
//function helper
function authenticateUser(email, password) {
  var isAuthenticated = false;
  var result;
  for (var key in users) {
    if ((users[key].email === email) && bcrypt.compareSync(password, users[key].password)) {
      console.log("pw:", password)
      console.log("userkeypw:", users[key].password)
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
  var result = authenticateUser(req.body.email, req.body.password);
  console.log('hash bodypw', req.body.password)
  console.log('users', users)
  if (result) {
    res.cookie("user_id", result.id);
    res.redirect("/urls");
  } else {
    res.status(403);
    res.send("Incorrect Username or Password");
  }
});


app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  res.render("urls_register");
});

app.post("/register", (req, res) => {
  var checkEmailResult = checkExistingEmail(req.body.email);
  if (req.body.email === "" || req.body.password === "") {
    res.status(401);
    res.send("Unauthorized. Please enter your email and password.");
  }
  if (checkEmailResult) {
    res.send(401, "This email has already registered.");
  } else {
    var hash = bcrypt.hashSync(req.body.password, 10)
    var newUser = {
      id: generateRandomString(),
      email: req.body.email,
      password: hash
    };
    users[newUser.id] = newUser;
    console.log("password: ", newUser.password);
    res.cookie("user_id", newUser.id);
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});