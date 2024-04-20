// JavaScript for café website

// Function to handle click event on specials section
document.getElementById('special').addEventListener('click', function() {
    var specials = ['Today\'s special: Blueberry Muffin', 'Today\'s special: Chocolate Croissant', 'Today\'s special: Caramel Macchiato'];
    var randomIndex = Math.floor(Math.random() * specials.length);
    this.textContent = specials[randomIndex];
    // console.log("jdsggvcjwhgdchvkgcj")
});
