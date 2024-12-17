const validator = require('validator');
const passwordValidator = require('password-validator');

function checkRequiredFields(data, requiredFields) {
  
  if (typeof data !== 'object' || data === null) {
    return false;
  }
    for (let field of requiredFields) {
      if (!(field in data) || !data[field]) {
        // console.log("[CHECK REQUIRED FIELD] Field : ", field, " data[field]: " + data[field])
        return false;
      }
    }
    return true;
  }

function checkAuthorizedFields(data, authorizedFields) {
  for (let field in data) {
    if (!authorizedFields.includes(field)) {
      // console.error("[CHECK AUTHORIZED FIELDS] Invalid field: " + field)
      return false;
    }
  }  
  return true;
}

function usernameValidator(username) {
  if (typeof username !== 'string') {
    return { valid: false, reason:'Error not a string'}; // Happen only if injection 
  }
  username = username.trim();
  if (!validator.isLength(username, { min: 3, max: 20 })) {
    return { valid: false, reason: "Username must be between 3 and 20 characters."};
  }
  if (!validator.isAlphanumeric(username)) {
    return { valid: false, reason: "Username must contain only letters and numbers."};
  }
  const usernameRegex = /^[a-zA-Z0-9]+$/;
  if (!usernameRegex.test(username)) {
    return { valid: false, reason: "Username must contain only letters and numbers."};
  }
  return { valid: true };
}

function emailValidator(email) {
  if (typeof email != 'string') {
    return { valid: false, reason:'Error not a string'}; // Happen only if injection 
  }
  email = email.trim();
  if (!validator.isEmail(email)) {
    return { valid: false, reason: "Invalid email."};
  } 
  return { valid: true };
}

function validateBirthDate(date_of_birth) {
  const currentDate = new Date();
  if (typeof date_of_birth !== 'string' || date_of_birth.length !== 10) {
      return false;
  }
  const birthDate = new Date(date_of_birth);
  if (isNaN(birthDate.getTime()) || birthDate > currentDate) {
      return false;
  }
  const age = currentDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = currentDate.getMonth() - birthDate.getMonth();
  const dayDiff = currentDate.getDate() - birthDate.getDate();
  let adjustedAge = age;
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      adjustedAge--;
  }
  if (adjustedAge < 18 || adjustedAge > 110) {
      return false;
  }
  return true;
}

function isPasswordValid(password) {
  if (typeof password !== 'string') { return false; } 
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])[A-Za-z\d!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]{9,}$/;
  let passwordStrength; 
  if (!regex.test(password)) {
    return false;
  } else {
    const schema = new passwordValidator();
    schema
      .is().min(9)
      .has().uppercase()
      .has().lowercase()
      .has().digits()
    const isValid = schema.validate(password);
    return isValid;
  }
}

function validateCreateUser(data) {
    if (!checkRequiredFields(data, ["username", "email", "password", "first_name", "last_name", "date_of_birth", "gender"])) {
      return false;
    }
    if (!checkAuthorizedFields(data, ["username", "email", "password", "first_name", "last_name", 
      "date_of_birth", "gender", "sexual_pref", "biography"])) {
        return false;
    }
    const currentDate = new Date();

    const usernameValidation = usernameValidator(data.username);
    if (!usernameValidation.valid) { return false; }
    const emailValidation = emailValidator(data.email);
    if (!emailValidation.valid) { return false; }
    if (!isPasswordValid(data.password)) { return false; }
    if (typeof data.first_name !== 'string' || (data.first_name.length > 255 || data.first_name.length < 1)) { return false; }
    if (typeof data.last_name !== 'string' || (data.last_name.length > 255 || data.last_name.length < 1)) { return false; }
    if (validateBirthDate(data.date_of_birth) === false) { return false;}
    if (data.gender && (typeof data.gender !== 'string' || (data.gender !== 'man' && data.gender !== 'woman'))) { return false; }
    if (data.sexual_pref && (typeof data.sexual_pref !== 'string' || !['homosexual', 'heterosexual', 'bisexual'].includes(data.sexual_pref))) { return false; }
    if (data.biography && (typeof data.biography !== 'string' || data.biography.length > 500)) { return false; }

    return true;
  }
  
function isArrayOfStrings(value) {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function validatePatchUser(data) {
  if (!checkAuthorizedFields(data, ["email", "password", "first_name", "last_name", 
  "gender", "date_of_birth", "sexual_pref", "biography", "fame_rating", "nb_views", "nb_likes", "tags"])) {
    return false;
  }
  
  for (const field in data) {
    if (field === 'email') {
      const emailValidation = emailValidator(data[field]);
      if (!emailValidation.valid) { return false; }
    }
    if (field === 'password' && (typeof data[field] !== 'string' || (data[field].length > 255 || data[field].length < 1))) return false;
    if (field === 'first_name' && (typeof data[field] !== 'string' || (data[field].length > 255 || data[field].length < 1))) return false;
    if (field === 'last_name' && (typeof data[field] !== 'string' || (data[field].length > 255 || data[field].length < 1))) return false;
    if (field === 'date_of_birth') { if (validateBirthDate(data[field]) === false) { return false;} }
    if (field === 'gender' && data[field] && (typeof data[field] !== 'string' || (data[field] !== 'man' && data[field] !== 'woman'))) return false;
    if (field === 'sexual_pref' && (typeof data[field] !== 'string' || !['homosexual', 'heterosexual', 'bisexual'].includes(data[field]))) return false;
    if (field === 'biography' && data[field] && (typeof data[field] !== 'string' || data[field].length > 500)) return false;
    if (field === 'fame_rating' && (typeof data[field] !== 'number' || data[field] < 1 || data[field] > 5)) return false;
    if (field === 'nb_views' && (typeof data[field] !== 'number' || data[field] < 0)) return false;
    if (field === 'nb_likes' && (typeof data[field] !== 'number' || data[field] < 0)) return false;
    if (field === 'tags' && !isArrayOfStrings(data[field])) { return false; }
  }
  return true;
}

function validatePatchLocation(data) {
  if (!checkRequiredFields(data, ["latitude", "longitude"])) {
    return false;
  }
  for (const field in data) {
    if (field === 'latitude' && (typeof data[field] !== 'number' || (data[field] > 90 || data[field] < -90))) return false;
    if (field === 'longitude' && (typeof data[field] !== 'number' || (data[field] > 180 || data[field] < -180))) return false;
  }
  return true; 
}

function validateUuid(data) {
  if (!checkRequiredFields(data, ["uuid"])) {
    return false;
  }
  for (const field in data) {
    if (field === 'uuid' && (typeof data[field] !== 'string' || data[field].length !== 36)) return false;
  }
  return true;
}

function validatePassword(data) {
  if (!checkRequiredFields(data, ["password"])) {
    return false;
  }
  for (const field in data) {
    if (field === 'password') {
      if (!isPasswordValid(data[field])) { return false; }
    }
  }
  return true;
}

function validateLogin(data) {
  if (!checkRequiredFields(data, ["username", "password"])) {
    return false;
  }
  for (const field in data) {
    if (field === 'username' && (typeof data[field] !== 'string' || data[field].length > 255 || data[field].length < 1)) return false;
    if (field === 'password' && (typeof data[field] !== 'string' || data[field].length > 255 || data[field].length < 1)) return false;
  }
  return true;
}

function validateEmail(data) {
  if (!checkRequiredFields(data, ["email"])) {
    return false;
  }
  for (const field in data) {
    if (field === 'email') {
      if (!validator.isEmail(data[field])) {
        return false;
      }
    }
  }
  return true;
}

function validatePicture(file) {
  if (!file) { return false; }
  const accepted_fieldnames = ['PROFILE', 'ADDITIONAL'];
  if (!accepted_fieldnames.includes(file.fieldname)) { return false; }
  const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!validMimeTypes.includes(file.mimetype)) { return false; }
  //(octets, 5 MB = 5 * 1024 * 1024)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) { return false; }
  return true;
}

function validateUser(data) {
  if (!checkRequiredFields(data, ["id", "username"])) {
    return false;
  }
  return typeof data.id === 'number' && typeof data.username === 'string';
}

function validateNewMessage(data) {
  // console.log("DATA: ", data);
  if (!checkRequiredFields(data, ["to", "content", "timestamp"])) {
    return false;
  }
  for (const field in data) {
    if ((field === 'to') && (typeof data[field] !== 'object' || !validateUser(data[field]))) {
      // console.log("to field is not a valid User object");
      // console.log(validateUser(data[field]));
      return false;
    }
    if (field === 'content' && typeof data[field] !== 'string') {
      // console.log("content field is not a string");
      return false;
    }
    if (field === 'timestamp' && typeof data[field] !== 'string') {
      // console.log("timestamp field is not a string");
      return false;
    }
  }
  return true;
}

module.exports = { 
    validateCreateUser,
    validatePatchUser,
    validatePatchLocation,
    validateUuid,
    validateLogin,
    validateEmail,
    validatePassword,
    validatePicture,
    usernameValidator,
    emailValidator,
    validateNewMessage
 };