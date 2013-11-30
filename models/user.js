var mongoose = require('mongoose'),
    bcrypt = require('bcrypt'),
    SALT_WORK_FACTOR = 10;

var roles = {
    user:1,
    admin: 2,
    developer: 3
}

var userSchema = new mongoose.Schema({
    username:   {type: String, required: true, index: 'hashed'},
    password:   {type: String, required: true},
    firstName:  {type: String, required: true},
    lastName:   {type: String, required: true},
    email:      {type: String, index: 'hashed'},
    role: Number,
    emailApproved: Number,
    withPhoto: Boolean,
    birthDate: Date,
    accessToken: String
}, {collection: 'users'});

userSchema.set('autoIndex', false);

userSchema.methods = {
    getFullName: function() {
        return this.firstName + " " + this.lastName;
    },
    isEmailApproved: function() {
        return !!this.emailApproved;
    },
    isAdmin: function() {
        return this.role == roles.admin;
    },
    isDeveloper: function() {
        return this.role == roles.developer;
    },
    getPhoto: function() {
        if (!this.withPhoto) return false;
        return 'Photo'; // fixme
    },
    /* special methods */
    checkPassword: function(candidatePassword, cb) {
        bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
            if(err) return cb(err);
            cb(null, isMatch);
        });
    },
    generateRandomToken: function () {
        var chars = "_!abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
            token = new Date().getTime() + '_';

        for (var x = 0; x < 16; x++) {
            var i = Math.floor(Math.random() * 62);
            token += chars.charAt(i);
        }
        return token;
    }
};

/**
 * Bcrypt middleware for password
 * and create md5 hash for email
 */
userSchema.pre('save', function(next) {
    var user = this;

    if (!user.isModified('password')) return next();

    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);

        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err);
            user.password = hash;
            next();
        });
    });
});


var externalUserSchema = new mongoose.Schema({
    innerId: String,
    vkId: Number, // vk
    fbId: Number, // facebook
    twId: Number, // twitter
    instagram: String
});

exports.User = mongoose.model('users', userSchema);
exports.ExtUser = mongoose.model('extUsers', externalUserSchema);

