const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

mongoose.connect('mongodb+srv://nivethag2023cse:nivi1234@nivetha-g.srmli.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', UserSchema);

app.post('/register', async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try{
    const existingUser= await User.findOne({username});
    if(existingUser){
        return res.status(400).json({ message: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
const newUser = new User({ username, password: hashedPassword });
await newUser.save();
res.status(200).json({ message: 'Registration successful' });
}
catch(err){
    console.error(err);
    res.status(500).json({ message: 'Registration failed' });
}

});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    try {
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }
        res.status(200).json({ message: 'Login successful' });
    } catch (err) {
        console.error(err);
         res.status(500).json({ message: 'Login failed' });
    }
});

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  subscribers: [String],
});
const Post = mongoose.model('Post', PostSchema);


app.post('/createpost', async (req, res) => {
  try {
      const { title, content } = req.body;
      if (!title || !content) {
          return res.status(400).json({ message: 'Title and content are required' });
      }
      const newPost = new Post({ title, content });
      await newPost.save();
      res.status(201).json({ message: 'Post created successfully', post: newPost });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

app.get('/posts', async (req, res) => {
  try {
      const posts = await Post.find().sort({ createdAt: -1 }); 
      res.status(200).json(posts);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching posts', error: error.message });
  }
});

app.post('/posts/:id/subscribe', async (req, res) => {
  try {
      const { email } = req.body;
      const post = await Post.findById(req.params.id);

      if (!post) {
          return res.status(404).json({ message: "Post not found" });
      }

      if (!post.subscribers.includes(email)) {
          post.subscribers.push(email);
          await post.save();
      }

      res.json({ message: "Subscription successful", post });
  } catch (error) {
      res.status(500).json({ message: "Subscription failed", error });
  }
});


const ProfileSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String },
  dob: { type: Date },
  experience: { type: String },
  description: { type: String },
  specialization: { type: String },
  awards: { type: String },
  photo: { type: String },
  socialLinks: {
    facebook: { type: String },
    twitter: { type: String },
    instagram: { type: String },
    linkedin: { type: String }
  }
});

const Profile = mongoose.model('Profile', ProfileSchema);

app.get('/profile/:username', async (req, res) => {
  const username = req.params.username;
  try {
    const profile = await Profile.findOne({ username });
    if (profile) {
      res.json(profile);
    } else {
      res.status(404).json({ message: 'Profile not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/profile/:username', async (req, res) => {
  const username = req.params.username;
  const { name, dob, experience, description, specialization, awards, photo, socialLinks } = req.body;

  try {
    const updatedProfile = await Profile.findOneAndUpdate(
      { username },
      { name, dob, experience, description, specialization, awards, photo, socialLinks },
      { new: true, upsert: true }
    );

    if (updatedProfile) {
      res.json(updatedProfile);
    } else {
      res.status(404).json({ message: 'Profile not found' });
    }
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



app.delete('/posts/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const deletedPost = await Post.findByIdAndDelete(id);
      
      if (!deletedPost) {
          return res.status(404).json({ message: 'Post not found' });
      }

      res.json({ message: 'Post deleted successfully' });
  } catch (error) {
      res.status(500).json({ message: 'Error deleting post' });
  }
});


app.put('/posts/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const { content } = req.body;  

      const updatedPost = await Post.findByIdAndUpdate(id, { content }, { new: true });

      if (!updatedPost) {
          return res.status(404).json({ message: 'Post not found' });
      }

      res.json(updatedPost);  
  } catch (error) {
      res.status(500).json({ message: 'Error updating post' });
  }
});


app.listen(4000, () => {
  console.log('Server is running on port http://localhost:4000');
});

