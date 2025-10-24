const { Schema, model } = require("mongoose");

// TODO: Please make sure you edit the User model to whatever makes sense in this case
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true
    },

   username: {
      type: String,
      required: [true, 'Username is required.'],
      unique: true
    },

    password: {
      type: String,
      required: [true, 'Password is required.']
    },
    
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    color: {
      type: String,
      default: '#6b066fff'
    }
    
  },

    { 
      timestamps: true
    }
  );

const User = model("User", userSchema);

module.exports = User;
