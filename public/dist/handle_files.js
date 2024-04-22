//delete gallery images
document.querySelectorAll('.edit-delete-button').forEach(button => {
  button.addEventListener('click', async () => {
      const albumName = button.dataset.albumName;
      const imageName = button.dataset.imageName;
      console.log(albumName, imageName)

      try {
          const response = await fetch(`/delete-image/${albumName}/${imageName}`, {
              method: 'DELETE'
          });
          if (response.ok) {
            // Image deleted successfully
            alert('Image deleted successfully');
            window.location.reload(true);
          } else {
            // Failed to delete image
            alert('Failed to delete image. Please try again later.');
          }
      } catch (error) {
          console.error('Error deleting image:', error);
      }
  });
});

//delete news
document.querySelectorAll('.delete-news').forEach(button => {
  button.addEventListener('click', async () => {
      const postId = button.dataset.id;
      // Confirm deletion with the user
      const confirmation = confirm('Are you sure you want to delete this post?');
      if (!confirmation) return; // If user cancels, do nothing


      try {
          const response = await fetch(`/delete/news/${postId}`, {
              method: 'DELETE'
          });
          if (response.ok) {
            // Image deleted successfully
            alert('Post deleted successfully');
            window.location.reload(true);
          } else {
            // Failed to delete image
            alert('Failed to delete post. Please try again later.');
          }
      } catch (error) {
          console.error('Error deleting post:', error);
      }
  });
});

//add review
document.addEventListener('DOMContentLoaded', function () {
  const addReviewImgBtn = document.getElementById('add-review-img');
  const fileInput = document.querySelector('.reviewFileInput');
  const reviewImg = document.querySelector('.review-img-add');
  const reviewForm = document.getElementById('reviewForm');

  // Function to handle file input change
  fileInput.addEventListener('change', function () {
    const file = this.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = function (e) {
        reviewImg.src = e.target.result;
      }

      reader.readAsDataURL(file);
    }
  });

  // Function to handle click on add review image button
  addReviewImgBtn.addEventListener('click', function () {
    fileInput.click();
  });

  reviewForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    // Retrieve name and review from form inputs
    const name = document.getElementById('review-name').value;
    const review = document.getElementById('review').value;
    const file = fileInput.files[0];

    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    }
    formData.append("name", name);
    formData.append("review", review);

    // Change the submit button text to "Submitting..."
    const submitButton = reviewForm.querySelector('button[type="submit"]');
    submitButton.textContent = 'Submitting...';

    try {
      const response = await fetch('/', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        console.log('Review submitted successfully');
        alert('Thank You for your review.');
        window.location.reload();
      } else {
        console.error('Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      // Revert the submit button text back to "Submit Review"
      submitButton.textContent = 'Submit Review';
    }
  });
});

//delete review
document.addEventListener('DOMContentLoaded', function() {
  // Add event listener to all delete buttons
  const deleteButtons = document.querySelectorAll('.delete-review');
  deleteButtons.forEach(deleteButton => {
    deleteButton.addEventListener('click', async () => {
      // Confirm deletion with the user
      const confirmation = confirm('Are you sure you want to delete this review?');
      if (!confirmation) return; // If user cancels, do nothing

      const reviewId = deleteButton.dataset.reviewId;
      const imagePresent = deleteButton.parentElement.querySelector('.ImagePresent').value; // Get the value of the input element

      console.log(imagePresent)
      try {
        const response = await fetch(`/delete-review/${reviewId}/${imagePresent}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          // Review deleted successfully
          alert('Review deleted successfully');
          window.location.reload(true);
        } else {
          // Failed to delete review
          alert('Failed to delete review. Please try again later.');
        }
      } catch (error) {
        console.error('Error deleting review:', error);
      }
    });
  });
});

//add news
document.addEventListener('DOMContentLoaded', function () {
  const addMainImg = document.getElementById('add-main-img');
  const fileInputMain = document.querySelector('.fileInputMain');
  const newsImgMain = document.querySelector('.news-img-main');
  const newsForm = document.getElementById('newsForm');

  const addOptionalImg = document.getElementById('add-optional-img');
  const fileInputOptional = document.querySelector('.fileInputOptional');
  const imageGallery = document.querySelector('.image-gallery-edit');

  const allOptionalFile = [];

  // Function to handle main file input change
  fileInputMain.addEventListener('change', function () {
    const file = this.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = function (e) {
        newsImgMain.src = e.target.result;
      };

      reader.readAsDataURL(file);
    }
  });

  // Function to handle click on add main image button
  addMainImg.addEventListener('click', function () {
    fileInputMain.click();
  });

  // Function to handle optional file input change
  fileInputOptional.addEventListener('change', function () {
    const files = this.files;

    if (files.length > 0) {
      for (const file of files) {
        allOptionalFile.push(file);
        const reader = new FileReader();

        reader.onload = function (e) {
          const galleryEditItem = document.createElement('div');
          galleryEditItem.classList.add('gallery-edit-item');

          const imageEditContainer = document.createElement('div');
          imageEditContainer.classList.add('image-edit-container');

          const img = document.createElement('img');
          img.classList.add('thumbnail');
          img.src = e.target.result;

          const deleteButton = document.createElement('button');
          deleteButton.classList.add('edit-delete-button');
          deleteButton.textContent = 'x';

          // Function to handle click on delete button
          deleteButton.addEventListener('click', function () {
            // Remove the file from the list
            const index = allOptionalFile.indexOf(file);
            if (index !== -1) {
              allOptionalFile.splice(index, 1);
            }

            // Remove the image item div
            imageGallery.removeChild(galleryEditItem);
          });

          imageEditContainer.appendChild(img);
          imageEditContainer.appendChild(deleteButton);
          galleryEditItem.appendChild(imageEditContainer);

          imageGallery.appendChild(galleryEditItem);
        };

        reader.readAsDataURL(file);
      }
    }
  });

  // Function to handle click on add optional image button
  addOptionalImg.addEventListener('click', function () {
    fileInputOptional.click();
  });

  newsForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    // Retrieve name and review from form inputs
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const mainFile = fileInputMain.files[0];
    const optionalFiles = allOptionalFile;

    // console.log(mainFile, optionalFiles);

    const formData = new FormData();
    if (mainFile) {
      formData.append("mainFile", mainFile);
    }
    if (optionalFiles.length > 0) {
      optionalFiles.forEach((file, index) => {
        formData.append(`optionalFile${index}`, file);
      });
    }
    formData.append("title", title);
    formData.append("description", description);

    // Change the submit button text to "Submitting..."
    const submitButton = newsForm.querySelector('button[type="submit"]');
    submitButton.textContent = 'Please Wait. Uploading...';

    try {
      const response = await fetch('/add-news/new', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        console.log('News submitted successfully');
        alert('New News added.');
        window.location.reload();
      } else {
        console.error('Failed to upload news');
      }
    } catch (error) {
      console.error('Error uploading news:', error);
    } finally {
      // Revert the submit button text back to "Submit Review"
      submitButton.textContent = 'Add';
    }
  });
});

//add gallery images
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener to all upload buttons
  const uploadButtons = document.querySelectorAll('.uploadButton');
  uploadButtons.forEach(uploadButton => {
    uploadButton.addEventListener('click', () => {
      // Find the corresponding file input and album name input
      const fileInput = uploadButton.parentElement.querySelector('.fileInput');
      const albumNameInput = uploadButton.parentElement.querySelector('.albumName');

      // Check if albumNameInput exists
      if (!albumNameInput) {
        console.error('Album name input not found');
        return;
      }

      // Trigger click event on the file input
      fileInput.click();
    });
  });
  
  const fileInputs = document.querySelectorAll('.fileInput');
  fileInputs.forEach(fileInput => {
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return; // No file selected

      try {
        // Find the corresponding album name input and retrieve the value
        const albumNameInput = fileInput.parentElement.querySelector('.albumName');
        if (!albumNameInput) {
          console.error('Album name input not found');
          return;
        }
        const albumName = albumNameInput.value;

        // Resize the image before uploading
        const resizedOrOriginalFile =  await resizeOrUseOriginalImage(file);

        // Create a FormData object to hold the resized image and album name
        const formData = new FormData();
        formData.append('image', resizedOrOriginalFile);
        formData.append('album', albumName);

        // Send a POST request to the server to upload the resized image
        const response = await fetch('/add-image', {
          method: 'PUT',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          const imageUrl = data.imageUrl;
          alert('Image uploaded successfully');
          window.location.reload(true);
        } else {
          console.error('Failed to upload image. Please try again later.');
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    });
  });
});


function resizeOrUseOriginalImage(file) {
  return new Promise((resolve, reject) => {
    // Check if file size exceeds 5.8MB (in bytes)
    const maxSize = 5.8 * 1024 * 1024; // 5.8MB in bytes
    if (file.size > maxSize) {
      // If file size exceeds 5.8MB, resize the image
      resizeImage(file).then(resizedFile => {
        resolve(resizedFile);
      }).catch(error => {
        reject(error);
      });
    } else {
      // If file size is within the limit, use the original image
      resolve(file);
    }
  });
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas dimensions
        const maxWidth = 2000;
        const maxHeight = 1500;
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while preserving aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw the image onto the canvas with highest quality settings
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas content back to a Blob
        canvas.toBlob(blob => {
          if (!blob) {
            reject(new Error('Could not resize the image.'));
            return;
          }
          // Create a new File object from the Blob
          const resizedFile = new File([blob], file.name, { type: file.type, lastModified: Date.now() });

          // Resolve the promise with the resized File object
          resolve(resizedFile);
        }, file.type, 1); // Use quality parameter (1 = best quality)
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// sendEmail.js

// Function to send an email
async function sendEmail(event) {
  event.preventDefault(); // Prevent the default form submission behavior

  // Get form data
  const formData = new FormData(event.target);

  // Get the submit button
  const submitButton = event.target.querySelector('button[type="submit"]');

  try {
    // Change button text to "Sending"
    submitButton.textContent = 'Sending...';

    // Disable the button while sending
    submitButton.disabled = true;

    // Fetch endpoint to send email
    const response = await fetch('/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(Object.fromEntries(formData))
    });

    // Parse response
    const responseData = await response.json();

    // Check if response is successful
    if (response.ok) {
      // Display success message
      alert('Thank you for your message. A response will be provided shortly.');
      window.location.reload();
    } else {
      // Display error message
      alert('Failed to send. Try again later');
      window.location.reload();
    }
  } catch (error) {
    console.error('Error:', error);
    // Display error message
    alert('Error: Failed to send email');
  } finally {
    // Reset button text to "Send message"
    submitButton.textContent = 'Send message';

    // Re-enable the button
    submitButton.disabled = false;
  }
}

// Add event listener to the form
document.getElementById('contactForm').addEventListener('submit', sendEmail);

