var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
var bodyParser = require("body-parser");
var bcrypt = require('bcrypt');
var cookieSession = require('cookie-session')


//middleware
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));  //ORDER????
app.use(cookieSession({
  secret: "wowihaveasuperlongsecretkey"
  // maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

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
  if (req.session.user_id){
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => { 
  let templateVars = {
    urls: {},
    user: null
  };
  if (req.session.user_id) {
    templateVars = {
      urls: urlDatabase[req.session.user_id],
      user: users[req.session.user_id]
    };
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => { //if statement if the user id match???
  let templateVars = {
    user: null
  };
  if (req.session.user_id) {
    templateVars = {
    user: users[req.session.user_id]
  };
 res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.post("/urls", (req, res) => {
  var generateFun = generateRandomString();
  if (urlsForUser(req.session.user_id)) {
    urlDatabase[req.session.user_id][generateFun] = req.body.longURL;
  };
  res.redirect("/urls/" + generateFun);
});

//function helper
function flatenUrlDatabase(urlDatabase){
  var newUrlDatabase = {};
  for (var userId in urlDatabase){
    for (var shortURL in urlDatabase[userId]){
      newUrlDatabase[shortURL] = urlDatabase[userId][shortURL];
    }
  }
  return newUrlDatabase;
}

app.get("/u/:shortURL", (req, res) => {
  var newUrlDatabase = flatenUrlDatabase(urlDatabase);
  var longURL = newUrlDatabase[req.params.shortURL];
  
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
  if (req.session.user_id) {
  delete urlDatabase[req.session.user_id][deleteshortURL];
  res.redirect("/urls");
  } else {
    res.end("YOU ARE NOT LOGGED IN! GO AWAY!");
  }
});


//new add for shortened form 
app.get("/urls/:id", (req, res) => {   //template changed
  let templateVars = {
      shortURL: "",
      user: null,
      state: "NOT_EXIST"
  }
  if (req.session.user_id) {
      templateVars.shortURL = req.params.id;
      templateVars.user = users[req.session.user_id];
  } 
  templateVars.state = "NOT_EXIST"; 
  for (var userId in urlDatabase) {
    for (var short in urlDatabase[userId]) {
        // exist and belongs to someone
        if (short === req.params.id){
          templateVars.state = "AUTHED"
            if (userId !== req.session.user_id){
              templateVars.state = "NO_AUTH"
            }
        }
    }
  }
  res.render("urls_show", templateVars);
});

//update URL
app.post("/urls/:id", (req, res) => {
  var shortURL = req.params.id;
  if (req.session.user_id) {
  urlDatabase[req.session.user_id][shortURL] = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.end("YOU ARE NOT LOGGED IN! GO AWAY!");
  }
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

app.post("/login", (req, res) => { 
  var result = authenticateUser(req.body.email, req.body.password);
  if (result) {
    req.session.user_id = result.id;
    res.redirect("/urls");
  } else {
    res.status(403);
    res.send("Incorrect Username or Password");
  }
});


app.post("/logout", (req, res) => {
  req.session = null;
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
    req.session.user_id = newUser.id;
    urlDatabase[req.session.user_id] = {};
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});