document.addEventListener("DOMContentLoaded", function () {

    // Load header first
    fetch("/components/header.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("header-placeholder").innerHTML = data;

            // Now attach hamburger click AFTER header exists
            const hamburger = document.getElementById("hamburger");
            const menu = document.getElementById("menu");

            if (hamburger && menu) {
                hamburger.addEventListener("click", function () {
                    menu.classList.toggle("open");
                });
            }
        });

});