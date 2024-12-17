const multer = require('multer');
const express = require("express");
const path = require('path');
const { validatePicture } = require("./database/validators");
const { confirm_email } = require("./account/email/confirmation");
const { update_email } = require("./account/email/update");
const { forgotten_pwd } = require("./account/password/forgotten");
const { recover_pwd } = require("./account/password/recover");
const { login } = require("./account/login");
const { register } = require("./account/register");
const { authenticateToken, checkAuth } = require('./account/authMiddleware');
const { logout } = require("./account/logout");
const { home } = require("./pages/home")
const { 
        get_profile, 
        patch_profile, 
        get_file, 
        patch_location, 
        patch_pictures, 
        get_pictures,
        get_username 
      } = require("./account/profile");
const { get_viewed_profiles, get_viewers, get_likers, get_liked_profiles, } = require('./social/views_and_likes');
const { get_nearby } = require("./search/nearby");
const { v4: uuidv4 } = require('uuid');
const { get_chat_summary } = require("./chat/chat");
const { get_browsing, get_users_according_to_gender_and_sexual_pref } = require("./social/browsing");
const { get_tags } = require("./social/get-tags");
const { nominatimSearch } = require("./search/location");
const { search_profiles } = require("./social/research");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + path.extname(file.originalname)) //Appending extension
  }
})

const upload = multer({ 
  storage: storage, 
  fileFilter: function(req, file, cb) {
    if (validatePicture(file)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format or size'), false);
    }
  }
});

function configureRoutes(app) {
  app.post('/account/email/confirmation', confirm_email);
  app.post('/account/email/update', update_email);
  app.post('/account/password/forgotten', forgotten_pwd);
  app.post('/account/password/recover', recover_pwd);
  app.post('/account/login', login);
  app.post('/account/register', register);
  app.get('/account/logout', logout);
  app.get('/account/check-auth', checkAuth);
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Protected routes
  app.use(authenticateToken);
  app.get('/search', nominatimSearch);
  app.get('/nearby', get_nearby);
  app.get('/home', home);
  app.get('/account/profile', get_profile);
  app.patch('/account/profile', patch_profile);
  app.patch('/account/profile/location', patch_location);
  app.get('/account/profile/viewed', get_viewed_profiles);
  app.get('/account/profile/viewers', get_viewers);
  app.get('/account/profile/liked', get_liked_profiles);
  app.get('/account/profile/likers', get_likers);
  app.get('/account/pictures', get_pictures);
  app.get('/uploads/:filename', get_file);
  app.patch('/account/pictures', upload.fields([
    { name: 'PROFILE', maxCount: 1 },
    { name: 'ADDITIONAL', maxCount: 4 }
  ]), patch_pictures);
  app.get('/chat', get_chat_summary);
  app.get('/get-username/:id', get_username);
  app.get('/browsing', get_browsing);
  app.get('/browsing/users_for_me', get_users_according_to_gender_and_sexual_pref)
  app.get('/get-tags', get_tags);
  app.post('/research', search_profiles);
  
}

module.exports = {
  configureRoutes,
};
