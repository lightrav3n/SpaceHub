// Import necessary modules
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from "cors";
import routes from './routes/routes.js';

// Load environment variables from .env file
dotenv.config();
// console.log(dotenv.config());

// Create a new Express application
const app = express();

// Get the port number from environment variables or use 3000 as a default
const PORT = process.env.PORT || 3000;

// Get the MongoDB connection URL from environment variables
const CONNECTION_URL = process.env.MONGODB_URI;

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Enable JSON body parsing with a limit of 50mb
app.use(express.json({ limit: "50mb", extended: true }));

// Serve static files from the 'views' directory
app.use(express.static('views'));

// Use the routes defined in routes.js
app.use(routes);

// Error handling middleware
app.use((err, req, res, next) => {
  // Log the error stack trace
  console.error(err.stack);

  // Send a 500 error response
  res.status(500).send('Something broke!');
});

// Function to start the server and connect to MongoDB
const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(CONNECTION_URL);
    console.log('MongoDB connected');

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    // Log any errors that occurred while connecting to MongoDB
    console.error('MongoDB connection error:', err);
  }
};

// Start the server
startServer();