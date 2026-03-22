// script.js

// Smooth Scroll Functionality
const smoothScroll = (target) => {
    const targetElement = document.querySelector(target);
    targetElement.scrollIntoView({ behavior: 'smooth' });
};

// Event listener for navigation links
const navLinks = document.querySelectorAll('a[href^="#"]');
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('href');
        smoothScroll(target);
    });
});

// Interactive Navigation Effects
const nav = document.querySelector('nav');
const toggleNav = () => {
    nav.classList.toggle('active');
};

const navToggleBtn = document.querySelector('.nav-toggle');
navToggleBtn.addEventListener('click', toggleNav);

