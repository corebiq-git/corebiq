/* =================================================
       YEAR
    ================================================== */

    document.getElementById("year").textContent =
        new Date().getFullYear();


    /* =================================================
       MOBILE NAVIGATION
    ================================================== */

    function toggleMobileMenu() {

        const menu =
            document.getElementById("mobileNav");

        if (menu.style.display === "block") {

            menu.style.display = "none";

        } else {

            menu.style.display = "block";

        }

    }


    function closeMobileMenu() {

        document.getElementById("mobileNav")
            .style.display = "none";

    }


    /* =================================================
       PRODUCT FILTER
    ================================================== */

    const filterButtons =
        document.querySelectorAll(".filter-btn");

    const productCards =
        document.querySelectorAll(".product-card");


    filterButtons.forEach(function(button) {


        button.addEventListener("click", function() {


            filterButtons.forEach(function(item) {

                item.classList.remove("active");

            });


            button.classList.add("active");


            const filter =
                button.getAttribute("data-filter");


            productCards.forEach(function(card) {


                if (
                    filter === "all" ||
                    card.getAttribute("data-category") === filter
                ) {

                    card.style.display = "flex";

                } else {

                    card.style.display = "none";

                }

            });

        });

    });


    /* =================================================
       CLOSE MOBILE NAV WHEN CLICKING OUTSIDE
    ================================================== */

    document.addEventListener("click", function(event) {


        const nav =
            document.getElementById("mobileNav");

        const menuButton =
            document.querySelector(".mobile-menu");


        if (

            nav.style.display === "block" &&

            !nav.contains(event.target) &&

            !menuButton.contains(event.target)

        ) {

            nav.style.display = "none";

        }

    });
