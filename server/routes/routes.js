// Import necessary modules
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { userSignup, userLogin, updateUserApiObjectId, fetchUser,removeUserApiObjectId } from '../controllers/userController.js';

import authMiddleware from '../middleware/auth.js';


// Create a new router
const router = express.Router();

// Get the current file's path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the path to the public directory
const publicPath = path.join(__dirname, '../views');

// Helper function to serve HTML files
const serveHTML = (fileName) => (req, res) => {
    // Send the specified HTML file
    res.sendFile(path.join(publicPath, `${fileName}.html`));
};

// Define routes for the home, signup, and login pages
router.get('/', serveHTML('home'));
router.get('/signup', serveHTML('signup'));
router.get('/login', serveHTML('login'));

// Define routes for user signup and login
router.post('/signup', userSignup);
router.post('/login', userLogin);

// Defines routes for user like and dislike
router.post('/api/user/like', authMiddleware, updateUserApiObjectId);
router.delete('/api/user/dislike', authMiddleware, removeUserApiObjectId);

// Define a route to fetch a user's data
router.get('/fetchUser', fetchUser);

// Export the router
export default router;