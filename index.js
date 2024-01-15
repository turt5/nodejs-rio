const express = require('express');
const multer = require('multer');
const bcrypt = require('bcrypt');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const app = express();
const port = process.env.PORT;

// Sequelize initialization
const sequelize = new Sequelize(process.env.DATABASE, process.env.USER, process.env.PASSWORD, {
  host: process.env.HOST,
  dialect: 'mysql',
});

// Define a User model
const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  profilePicture: {
    type: DataTypes.STRING,
  },
});

// Sync the model with the database
sequelize.sync()
  .then(() => {
    console.log('Database and tables synced.');
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
  });

// Configure Multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // cb(null, Date.now() + '-' + file.originalname);
    cb(null,file.originalname);

  },
});

const upload = multer({ storage: storage });

// Express middleware to parse JSON
app.use(express.json());

// Enable CORS (Cross-Origin Resource Sharing)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Serve uploaded images statically
app.use('/uploads', express.static('uploads'));

// API endpoint to store user data
app.post('/users', upload.single('profilePicture'), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user record
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      profilePicture: req.file ? req.file.filename : null,
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).send('Internal Server Error');
  }
});

// API endpoint for user login
// API endpoint for user login
app.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Find the user by email
      const user = await User.findOne({ where: { email } });
  
      // Check if the user exists
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Compare the provided password with the hashed password in the database
      const isPasswordValid = await bcrypt.compare(password, user.password);
  
      // If the passwords match, return the user ID along with a success message
      if (isPasswordValid) {
        return res.status(200).json({ userId: user.id, status: 'true' });
      } else {
        // If the passwords do not match, return an error message
        return res.status(401).json({ status: 'false' });
      }
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  

// API endpoint to fetch user data (excluding password)
app.get('/users/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
  
      // Find the user by ID
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
      });
  
      // If the user is found, return the user data
      if (user) {
        res.status(200).json(user);
      } else {
        // If the user is not found, return a 404 response
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });