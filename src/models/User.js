// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema({
//     // id: {
//     //     type: String,
//     //     required: true,
//     //     unique: true
//     // },
//     name: {
//         type: String,
//         required: true, 
//         trim: true
//     },
//     email: {
//         type: String,
//         required: true,
//         unique: true,
//         lowercase: true,
//         trim: true
//     },
//     password: {
//         type: String,
//         required: true,
//         minlength: 8
//     },
//     isActive: {
//         type: Boolean,
//         default: true
//     },
//     token: {
//         type: String,
//         default: ""
//     }
// }, {
//     timestamps: true 
// });

// const User = mongoose.model("User", userSchema);

// module.exports = User;

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    password: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
