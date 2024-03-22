function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements at i and j
  }
  return array;
}
function toTitleCase() {
    document.querySelectorAll('.title-case').forEach(titleElement => {
      var word = titleElement.innerHTML.charAt(0).toUpperCase() + titleElement.innerHTML.slice(1).toLowerCase();
      titleElement.innerHTML = word; 
    })
}


toTitleCase()                                                     

function ramdomizeSize(){
  document.querySelectorAll('.my-image').forEach(image => {
    const windowWidth = window.innerWidth;
    if (windowWidth < 768) {
      image.style.maxWidth = '50%';
      const randomValue = (Math.floor(Math.random() * 3) + 2).toString()
      const scale = 'w-1/'+randomValue
      image.classList.add(scale)
    } else {
      image.style.maxWidth = '40%';
      const randomValue = (Math.floor(Math.random() * 3) + 4).toString()
      const scale = 'w-1/'+randomValue
      image.classList.add(scale)
    }
  });
}

function portfolioSize(){
  document.querySelectorAll('.portfolio-image').forEach(image => {
    const windowWidth = window.innerWidth;
    if (windowWidth < 768) {
      image.style.maxWidth = '50%';
    } else {
      image.style.maxWidth = '40%';
      const randomValue = (Math.floor(Math.random() * 3) + 4).toString()
      const scale = 'w-1/'+randomValue
      image.classList.add(scale)
    }
  });
}
ramdomizeSize()
portfolioSize()

function fadeIn(){
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
      delay += 400; // Increment delay for each photo
  });
}
fadeIn()
  
  // Add click event listeners to the buttons
document.querySelectorAll('.portfolio-menu button.btn').forEach(button => {

    button.addEventListener('click', function() {
      // Remove 'active' class from all buttons
      document.querySelectorAll('.portfolio-menu button.btn').forEach(btn => {
        btn.classList.remove('active');
      });
      // Add 'active' class to the clicked button
      this.classList.add('active');
      
      // Filter albums based on the data-filter attribute
      const filter = this.getAttribute('data-filter');
      document.querySelectorAll('.gallery-section').forEach(section => {
        const albumName = section.getAttribute('id'); // Get the id of the section
          
            if (albumName !== filter) {
              section.classList.add('hidden'); // Show sections that match the filter
            } else {
              section.classList.remove('hidden');
              toTitleCase()   // Hide sections that don't match the filter
              ramdomizeSize()
              fadeIn()
            }    
      });
       
    });
});

