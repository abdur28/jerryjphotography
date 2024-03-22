// This function gradually fades in the photos after DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
  const body = document.querySelector("body");
  body.classList.remove("opacity-0");
  body.classList.add("opacity-100");
  
  // Gradually fade in each photo with a delay
  const photos = document.querySelectorAll('img');
  let delay = 0;
  photos.forEach((photo) => {
      setTimeout(() => {
          photo.classList.remove("opacity-0");
          photo.classList.add("opacity-100");
      }, delay);
      delay += 50; // Increment delay for each photo
  });
  
});

// Function to check if an element is in the viewport
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Function to handle scroll event
function handleScroll() {
  const sections = document.querySelectorAll('.sliding-section');
  sections.forEach(section => {
    if (isInViewport(section)) {
      section.classList.add('in-view');
    }
  });
}

// Add scroll event listener
window.addEventListener('scroll', handleScroll);

// Initial check on page load
handleScroll();

// Check if user prefers dark mode and add a class accordingly
function checkDarkMode() {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.querySelector('.whatsapp').setAttribute('fill', 'white');
  } else {
    document.querySelector('.whatsapp').setAttribute('fill', 'black');
  }
}

// Initial check
checkDarkMode();

// Listen for changes in preferred color scheme
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', checkDarkMode);

document.addEventListener("DOMContentLoaded", function() {
  const addReviewButton = document.querySelector(".review-button");
  const modalOverlay = document.getElementById("modal-overlay");
  const closeModalButton = document.getElementById("close-modal");

  addReviewButton.addEventListener("click", function() {
    modalOverlay.style.display = "block";
    document.body.style.overflow = "hidden"; // disable scrolling on the body
  });

  closeModalButton.addEventListener("click", function() {
    modalOverlay.style.display = "none";
    document.body.style.overflow = ""; // enable scrolling on the body
  });
});

// Get the input field and character count span
const reviewInput = document.getElementById('review');
const charCountSpanReview = document.getElementById('char-count-review');

// Add an input event listener to the input field
reviewInput.addEventListener('input', function() {
    // Get the current value of the input field
    const currentLength = reviewInput.value.length;

    // Update the character count span
    charCountSpanReview.textContent = currentLength + '/100';
});


