const express = require('express');
const bodyParser = require("body-parser");
const https = require("https");
const ejs = require("ejs");
const mongoose = require("mongoose");
const path = require('path');
const sharp = require('sharp');
const multer = require('multer');
const compression = require('compression');
require('dotenv').config();
const nodemailer = require('nodemailer');
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const redis = require('redis');

const redisClient = redis.createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

redisClient.on('error', (err) => {
    console.log('Redis error:', err);
});

redisClient.on('end', () => {
    console.log('Disconnected from Redis');
});

redisClient.connect().then(() => {
    console.log('Connected to Redis');
}).catch((err) => {
    console.log('Failed to connect to Redis:', err);
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "jerryjphoto.appspot.com"
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.USER_EMAIL,
      pass: process.env.USER_KEY
    }
});

const app = express();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(compression());

const clientID = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET
const refreshToken = process.env.REFRESH_TOKEN
const tokenType = process.env.TOKEN_TYPE
const accountId = process.env.ACCOUNT_ID
const accountUsername = process.env.ACCOUNT_USERNAME
const mongoDBURL = process.env.MONGODB_URI

// Fetch all images from S3 bucket and cache the result
async function fetchAndCacheImages() {
    try {
        const cachedImages = await redisClient.get('images');
        if (cachedImages) {
            console.log('All images fetched from cache');
            return JSON.parse(cachedImages);
        }
        // console.log('not')
        const allImages = await fetchAllImagesFromFirebaseStorage();
    

        // Cache all images in Redis with a TTL of 3600 seconds (1 hour)
        await redisClient.setEx('images', 3600, JSON.stringify(allImages));

        console.log('All images fetched and cached');
        return allImages;
    } catch (error) {
        console.error('Error fetching all images:', error);
        return [];
    }
}

async function fetchAllImagesFromFirebaseStorage() {
    try {
        const bucket = admin.storage().bucket();
        const [files] = await bucket.getFiles();

        const imageUrls = await Promise.all(files.map(async file => {
            const name = file.name;
            const pictureTypes = ['.jpg', '.jpeg', '.png', '.gif'];
            const endsWithPictureType = pictureTypes.some(type => name.toLowerCase().endsWith(type));

            if (!endsWithPictureType) {
                return null; 
            }

            const [albumName, imageName] = name.split('/');

            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 1);
            expirationDate.setUTCHours(0, 0, 0, 0);

            const imageUrl = await file.getSignedUrl({
                action: 'read',
                expires: expirationDate.toISOString() 
            });

            return { albumName, imageName, imageUrl };
        }));

        const filteredUrls = imageUrls.filter(url => url !== null);

        // console.log(filteredUrls);
        return filteredUrls;
    } catch (error) {
        console.error('Error fetching images from Firebase Storage:', error);
        return [];
    }
}


mongoose.set("strictQuery", false);
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

const informationSchema = new mongoose.Schema({
    name: String,
    email: String,
    number: String,
    address: String,
    instagram: String,
    twitter: String,
    telegram: String,
    facebook: String,
    aboutPhoto: String,
    aboutMeInfo: String,
    bio: String,
});

const reviewSchema = new mongoose.Schema({
    name: String,
    review: String,
});

const newsSchema = new mongoose.Schema({
    title: String,
    description: String,
})

const Information = mongoose.model('Information', informationSchema);
const Review = mongoose.model('Review', reviewSchema);
const News = mongoose.model('News', newsSchema);



const fetchAdminInfo = async (req, res, next) => {
    try {
        const adminInfo = await Information.findOne();
        const reviews = await Review.find();
        const news = await News.find();
        res.locals.reviews = reviews;
        res.locals.adminInfo = adminInfo;
        res.locals.news = news;
        next();
    } catch (error) {
        console.error('Error fetching admin information:', error);
        res.status(500).send('Internal Server Error');
    }
};

app.use(fetchAdminInfo);

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; // Swap elements at i and j
    }
    return array;
  }

//home route and reviews
app.get('/', async (req, res) => {
    try {
        const allImages = await fetchAndCacheImages();
        const filteredImages = allImages.filter(image => image.albumName === 'highlights');
        const reviewImages = allImages.filter(image => image.albumName === 'reviews');
        const shuffledImages = shuffleArray(filteredImages);

        res.render('index', { images: shuffledImages, reviewImages: reviewImages, adminInfo: res.locals.adminInfo, reviews: res.locals.reviews });
    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).send('Error fetching images');
    }
});

app.post('/', upload.single('file'), async (req, res) => {
    try {
        const { name, review } = req.body;
        const reviewCard = new Review({
            name: name,
            review: review
        });

        const savedReview = await reviewCard.save();

        const file = req.file;
        if (!file) {
            return res.redirect('/');
        }

        if (savedReview.id){
            let fileName = savedReview.id;
            // Resize and optimize image with quality 90 using Sharp
            const optimizedImageBuffer = await sharp(file.buffer)
            .jpeg({ quality: 90 })
            .toBuffer();

            // Upload the image to Firebase Storage
            const bucket = admin.storage().bucket();
            const fileUpload = bucket.file(`reviews/${fileName}.jpg`);
            
            await fileUpload.save(optimizedImageBuffer, {
                metadata: {
                    contentType: file.mimetype
                }
            });
            const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;

            console.log("Uploaded to Firebase Storage");
        }
        await redisClient.flushDb();
        res.redirect('/')
    } catch (error) {
        console.error('Error saving review:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.delete('/delete-review/:id/:imagePresent', async (req, res) => {
    try {
        const reviewId = req.params.id;
        const imagePresent = req.params.imagePresent;

        // Construct the path to the image in Firebase Storage
        if(imagePresent === 'true') { 
            const filePath = `reviews/${reviewId}.jpg`;

            // Create a reference to the file in Firebase Storage
            const bucket = admin.storage().bucket();
            const file = bucket.file(filePath);

            // Delete the file from Firebase Storage
            await file.delete();

            console.log("Deleted from Firebase Storage");
        }

        // Find the review by ID and delete it
        const deletedReview = await Review.findByIdAndDelete(reviewId);
        if (!deletedReview) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Respond with a success message
        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


//news route
app.get('/news', async (req, res) => {
    try {
        const allImages = await fetchAndCacheImages();
        const filteredImages = allImages.filter(image => image.albumName === 'news');
        res.render('news', {images: filteredImages, news: res.locals.news});
    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).send('Error fetching images');
    }
});

app.get('/news/:id', async (req, res) => {
    try {
        const postId = req.params.id
        const {news} = res.locals
        const singlePost = news.filter(post => post.id === postId)[0];
        const allImages = await fetchAndCacheImages();
        const filteredImages = allImages.filter(image => image.imageName.startsWith(postId));
        res.render('single_news', {post: singlePost, images: filteredImages});
    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).send('Error fetching images');
    }
});


//contact route
app.get('/contact', async (req, res) => {
    try {
        const allImages = await fetchAndCacheImages();
        const contactAlbum = allImages.filter(image => image.albumName === 'contact');
        res.render('contact', { contactAlbum, adminInfo: res.locals.adminInfo });
    } catch (error) {
        console.error('Error fetching album images:', error);
        res.status(500).send('Error fetching album images');
    }
});

app.post('/contact', (req, res) => {
    const { email, name, message, myEmail } = req.body;

    // Prepare the email message
    const mailOptions = {
        from: 'Jerry J photography <abdurrahmanidris235@gmail.com>',
        to: myEmail,
        subject: `New Message from Website`,
        html: `<html><p>You got a new message from ${name}</p><p>Email: ${email}</p><p>Message: ${message}</p></html>`
    };

    // Send the email
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.error('Error sending email:', error);
            res.status(500).json({ error: 'Error sending email' });
        } else {
            console.log('Email sent successfully');
            res.status(200).json({ message: 'Email sent successfully' });
        }
    });
});

//about me route
app.get('/about-me', async (req, res) => {
    try {
        const allImages = await fetchAndCacheImages();
        const aboutMeAlbum = allImages.filter(image => image.albumName === 'about_me');
        res.render('about_me', { aboutMeAlbum, adminInfo: res.locals.adminInfo });
    } catch (error) {
        console.error('Error fetching album images:', error);
        res.status(500).send('Error fetching album images');
    }
});

//gallery route
app.get('/gallery', async (req, res) => {
    try {
        const allImages = await fetchAndCacheImages();
        const filteredImages = allImages.filter(image => image.albumName !== 'contact' && image.albumName !== 'about_me' && image.albumName !== 'highlights' && image.albumName !== 'reviews' && image.albumName !== 'news');
        const shuffledImages = shuffleArray(filteredImages);

        // Group images by album
        const albumsMap = new Map(); // Using a map to ensure albums are unique
        allImages.forEach(image => {
            const { albumName, imageName } = image;
            if (albumName !== 'contact' && albumName !== 'about_me' && image.albumName !== 'highlights' && image.albumName !== 'reviews' && image.albumName !== 'news') { // Exclude the "contact" album
                if (!albumsMap.has(albumName)) {
                    albumsMap.set(albumName, []);
                }
                albumsMap.get(albumName).push({ name: imageName, url: image.imageUrl });
            }
        });

        const albums = Array.from(albumsMap, ([name, images]) => ({ name, images }));

        res.render('gallery', { albums, images: shuffledImages });
    } catch (error) {
        console.error('Error fetching album images:', error);
        res.status(500).send('Error fetching album images');
    }
});

//admin routes
app.get('/iamtheowner01-admin', function (req, res) {
    res.render('admin', { adminInfo: res.locals.adminInfo });
});

app.post('/iamtheowner01-admin', async (req, res) => {
    try {
        const { address, number, email, instagram, twitter, telegram, facebook, aboutMeInfo, aboutPhoto, bio } = req.body;
        const { adminInfo } = res.locals;

        adminInfo.address = address.trim() || adminInfo.address;
        adminInfo.number = number.trim() || adminInfo.number;
        adminInfo.email = email.trim() || adminInfo.email;
        adminInfo.instagram = instagram.trim() || adminInfo.instagram;
        adminInfo.twitter = twitter.trim() || adminInfo.twitter;
        adminInfo.telegram = telegram.trim() || adminInfo.telegram;
        adminInfo.facebook = facebook.trim() || adminInfo.facebook;
        adminInfo.aboutPhoto = aboutPhoto.trim() || adminInfo.aboutPhoto;
        adminInfo.aboutMeInfo = aboutMeInfo.trim() || adminInfo.aboutMeInfo;
        adminInfo.bio = bio.trim() || adminInfo.bio;

        await adminInfo.save();

        res.redirect('/')
    } catch (error) {
        console.error('Error updating admin information:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/iamtheowner01-admin-news-edit', async (req, res) => {
    try {
        const allImages = await fetchAndCacheImages();
        const filteredImages = allImages.filter(image => image.albumName === 'news');
        res.render('news_edit', {news: res.locals.news, images: filteredImages});
    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).send('Error fetching images');
    }
});

app.get('/iamtheowner01-admin-add-news/:id', async (req, res) => {
    try {
        const id = req.params.id
        const allImages = await fetchAndCacheImages();
        const filteredImages = allImages.filter(image => image.imageName.startsWith(id));
        if (id !== "new"){
            const singleNews = await News.findById(id)
            res.render('edit_news', {post: singleNews, images: filteredImages});
        } else {
            res.render('add_news')
        }
        
    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).send('Error fetching images');
    }
});

app.delete('/delete/news/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const allImages = await fetchAndCacheImages();
        const filteredImages = allImages.filter(image => image.imageName.startsWith(id));

        // Construct the path to the image in Firebase Storage
        if (filteredImages.length > 0) {
            // Use Promise.all to delete all files asynchronously
            await Promise.all(filteredImages.map(async (image) => {
                const filePath = `news/${image.imageName}`;

                // Create a reference to the file in Firebase Storage
                const bucket = admin.storage().bucket();
                const file = bucket.file(filePath);

                // Delete the file from Firebase Storage
                await file.delete();
            }));
            console.log("Deleted from Firebase Storage");
        } else {
            console.log('no images')
        }

        // Find the review by ID and delete it
        const deletedPost = await News.findByIdAndDelete(id);

        if (!deletedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }
        // Respond with a success message
        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/edit-news/:id', async (req, res) => {
    try {
        const { title,  description} = req.body;
        const id = req.params.id
        const singleNews = await News.findById(id);

        singleNews.title = title.trim() || singleNews.title;
        singleNews.description = description.trim() || singleNews.description;


        await singleNews.save();

        res.redirect('/news')
    } catch (error) {
        console.error('Error updating admin information:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/add-news/new', upload.any(), async (req, res) => {
    try {
        const { title, description } = req.body;
        const mainFile = req.files.find(file => file.fieldname === 'mainFile');
        const optionalFiles = req.files.filter(file => file.fieldname.startsWith('optionalFile'));
        const newPost = new News({
            title: title,
            description: description
        });

        const savedNews = await newPost.save();


        const files = req.files;
        if (!files) {
            return res.redirect('/news');
        }

        if (savedNews.id){
            let folderName = savedNews.id;
            // Resize and optimize image with quality 90 using Sharp
            if (mainFile) {
                const file = mainFile
                const optimizedImageBuffer = await sharp(file.buffer)
                .jpeg({ quality: 90 })
                .toBuffer();

                // Upload the image to Firebase Storage
                const bucket = admin.storage().bucket();
                const fileUpload = bucket.file(`news/${folderName}_main.jpg`);
                
                await fileUpload.save(optimizedImageBuffer, {
                    metadata: {
                        contentType: file.mimetype
                    }
                });
                const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
            }

            if (optionalFiles) {
                for (let i = 0; i < optionalFiles.length; i++) {
                    const file = optionalFiles[i];
                    const optimizedImageBuffer = await sharp(file.buffer)
                    .jpeg({ quality: 90 })
                    .toBuffer();

                    // Upload the image to Firebase Storage
                    const bucket = admin.storage().bucket();
                    const fileUpload = bucket.file(`news/${folderName}_optional${i}.jpg`);
                    
                    await fileUpload.save(optimizedImageBuffer, {
                        metadata: {
                            contentType: file.mimetype
                        }
                    });
                    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
                }
            }
            

            console.log("Uploaded to Firebase Storage");
        }
        await redisClient.flushDb();
        res.redirect('/')
    } catch (error) {
        console.error('Error saving review:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/iamtheowner01-admin-gallery-edit', async (req, res) => {
    try {
        const allImages = await fetchAndCacheImages();

      // Group images by album
        const albumsMap = new Map(); // Using a map to ensure albums are unique
        allImages.forEach(image => {
            const { albumName, imageName } = image;
            if (albumName !== 'contact' && albumName !== 'about_me' && albumName !== 'reviews' && image.albumName !== 'news') { // Exclude the "contact" album
                if (!albumsMap.has(albumName)) {
                    albumsMap.set(albumName, []);
                }
                albumsMap.get(albumName).push({ name: imageName, url: image.imageUrl });
            }
        });

        const albums = Array.from(albumsMap, ([name, images]) => ({ name, images }));

        const reviewImages = allImages.filter(image => image.albumName === 'reviews');
        const contactAlbum = allImages.filter(image => image.albumName === 'contact');
        const aboutMeAlbum = allImages.filter(image => image.albumName === 'about_me');
        

        
        res.render('gallery_edit', { reviewImages, albums, contactAlbum, aboutMeAlbum, adminInfo: res.locals.adminInfo });
    } catch (error) {
        console.error('Error fetching album images:', error);
        res.status(500).send('Error fetching album images');
    }
});

app.delete('/delete-image/:album/:imageName', async (req, res) => {
    try {
        const { album, imageName } = req.params;

        // Construct the path to the image in Firebase Storage
        const filePath = `${album}/${imageName}`;

        // Create a reference to the file in Firebase Storage
        const bucket = admin.storage().bucket();
        const file = bucket.file(filePath);

        // Delete the file from Firebase Storage
        await file.delete();

        console.log("Deleted from Firebase Storage");
        await redisClient.flushDb();
        res.sendStatus(200);
    } catch (error) {
        console.error('Error deleting image from Firebase Storage:', error);
        res.status(500).json({ error: 'Error deleting image from Firebase Storage' });
    }
});


app.put('/add-image', upload.single('image'), async (req, res) => {
    try {
        const album = req.body.album;

        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Rename the file based on the album name
        let fileName;
        if (album === 'contact') {
            fileName = 'contact_pic.jpg';
        } else if (album === 'about_me') {
            fileName = 'about_me_pic.jpg';
        } else {
            fileName = file.originalname; // Use original file name if not contact or about_me
        }

        // Resize and optimize image with quality 90 using Sharp
        const optimizedImageBuffer = await sharp(file.buffer)
            .jpeg({ quality: 90 })
            .toBuffer();

        // Upload the image to Firebase Storage
        const bucket = admin.storage().bucket();
        const fileUpload = bucket.file(`${album}/${fileName}`);
        
        await fileUpload.save(optimizedImageBuffer, {
            metadata: {
                contentType: file.mimetype
            }
        });
        await redisClient.flushDb();
        const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;

        console.log("Uploaded to Firebase Storage");
        res.status(200).json({ imageUrl });
    } catch (error) {
        console.error('Error uploading image to Firebase Storage:', error);
        res.status(500).json({ error: 'Error uploading image to Firebase Storage' });
    }
});



const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("listening for requests");
    });
});
