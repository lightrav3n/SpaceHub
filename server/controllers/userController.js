// Import necessary modules
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import { avatars } from '../views/avatars.js';

// Define the number of salt rounds for bcrypt
const SALT_ROUNDS = 10;

// Define the secret code for JWT
const secretCode = process.env.KEY || 'iloveirina';

// Throw an error if the secret code is not defined
if (!secretCode) {
  throw new Error("Missing KEY environment variable");
}

// Function to handle user signup
export const userSignup = async (req, res) => {
  try {
    // Extract username, email, and password from the request body
    const { username, email, password } = req.body;
    console.log(`Received password: ${password}`);
    const avatar = avatars[Math.floor(Math.random() * avatars.length)]; // Choose a random avatar
    console.log(`Selected avatar: ${avatar}`);


    // Check if a user with the same email already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(409).json({ msg: "An account with this email already exists." });
    }

    // Create a new user
    const newUser = new User({
      username,
      email,
      password,
      avatar,
    });

    // Save the new user to the database
    await newUser.save();
    console.log(`User saved: ${JSON.stringify(newUser)}`);

    // Create a payload for the JWT
    const payload = {
      id: newUser._id,
      name: newUser.username,
      avatar: newUser.avatar,
    };

    // Sign the JWT
    const token = jwt.sign(payload, secretCode, { expiresIn: '24h' });

    // Send the JWT in the response
    res.status(200).json({ token });
  } catch (error) {
    // Log any errors that occurred
    console.error("Error in userSignup:", error);

    // Send a 500 error response
    res.status(500).json({ msg: `Server error: ${error.message}` });
  }
};

// Function to handle user login
export const userLogin = async (req, res) => {
  try {
    // Extract email and password from the request body
    const { email, password } = req.body;

    // Find the user with the given email
    let user = await User.findOne({ email });

    // If the user doesn't exist, send a 401 error response
    if (!user) {
      console.error(`No account with this email exists: ${email}`);
      return res.status(401).json({ msg: "No account with this email exists." });
    }

    // Compare the provided password with the user's password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`Password match for ${email}: ${isMatch}`);

    // If the passwords don't match, send a 401 error response
    if (!isMatch) {
      console.error(`Incorrect password for email: ${email}`);
      return res.status(401).json({ msg: "Incorrect password." });
    }

    // Create a payload for the JWT
    const payload = {
      id: user._id,
      name: user.username,
      avatar: user.avatar,
    };

    // Sign the JWT
    const token = jwt.sign(payload, secretCode, { expiresIn: '24h' });

    // Send the JWT and username in the response
    res.status(200).json({ token, avatar: user.avatar, username: user.username, message: 'Login successful' });
  } catch (error) {
    // Log any errors that occurred
    console.error("Error in userLogin:", error);

    // Send a 500 error response
    res.status(500).json({ msg: `Server error: ${error.message}` });
  }
};

// Function to handle user deletion
export const deleteUser = async (req, res) => {
  try {
    // Extract the user's ID from the request parameters
    const { id } = req.params;

    // Find the user with the given ID
    let user = await User.findById(id);

    // If the user doesn't exist, send a 404 error response
    if (!user) {
      console.error(`No user with this ID exists: ${id}`);
      return res.status(404).json({ msg: "No user with this ID exists." });
    }

    // Delete the user
    await User.findByIdAndDelete(id);

    // Send a success response
    res.status(200).json({ msg: 'User deleted successfully' });
  } catch (error) {
    // Log any errors that occurred
    console.error("Error in deleteUser:", error);

    // Send a 500 error response
    res.status(500).json({ msg: `Server error: ${error.message}` });
  }
};



export const updateUserApiObjectId = async (req, res) => {
  try {
    // Get the user ID from the decoded JWT
    const userId = req.user.id;

    // Get the API object ID from the request body
    const { apiObjectId } = req.body;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if the user has already liked the item
    if (user.apiObjectId.includes(apiObjectId)) {
      return res.status(400).json({ msg: 'You have already liked this item' });
    }

    // Update the user's `apiObjectId` field by pushing new ID
    user.apiObjectId.push(apiObjectId);
    await user.save();

    // Send a success response
    res.status(200).json({ msg: 'User updated successfully', user });
  } catch (error) {
    // Log any errors that occurred
    console.error("Error in updateUserApiObjectId:", error);

    // Send a 500 error response
    res.status(500).json({ msg: `Server error: ${error.message}` });
  }
};

export const removeUserApiObjectId = async (req, res) => {
  try {
    // Get the user ID from the decoded JWT
    const userId = req.user.id;

    // Get the API object ID from the request body
    const { apiObjectId } = req.body;

    // Update the user's `apiObjectId` field by pulling the ID
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { apiObjectId: apiObjectId } },
      { new: true }
    );

    // Send a success response
    res.status(200).json({ msg: 'User updated successfully', user });
  } catch (error) {
    // Log any errors that occurred
    console.error("Error in removeUserApiObjectId:", error);

    // Send a 500 error response
    res.status(500).json({ msg: `Server error: ${error.message}` });
  }
};
// Fetching user
export const fetchUser = async (req, res, next) => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers.authorization.split(' ')[1];

    // Verify the token and get the user's ID
    const decoded = jwt.verify(token, "iloveirina");
    // Fetch user from MongoDB based on ID
    const user = await User.findById(decoded.id);


    // Check if user exists
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Send user data as response
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getLikedItems = async (req, res) => {
  try {
    // Get the user ID from the decoded JWT
    const userId = req.user.id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Send the user's liked items in the response
    res.status(200).json(user.apiObjectId);
  } catch (error) {
    // Log any errors that occurred
    console.error("Error in getLikedItems:", error);

    // Send a 500 error response
    res.status(500).json({ msg: `Server error: ${error.message}` });
  }
};