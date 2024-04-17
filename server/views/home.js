import {avatars} from "./avatars.js";

// Get references to HTML elements
const elements = ['navbarImages', 'myModal', 'signupBtn', 'loginBtn', 'logoutBtn', 'likesBtn', 'searchButton', 'searchInput', 'searchResults', 'loginForm', 'signupForm', 'switchBtn']
    .reduce((acc, id) => ({ ...acc, [id]: document.getElementById(id) }), {});
const [span] = document.getElementsByClassName("close");
const loginInfo = document.querySelector('.login-info');

// Function to add an event listener to an element if it exists
function addEventListenerToElement(element, event, handler) {
    element?.addEventListener(event, handler);
}
// Function to get authentication info from local storage
function getAuthInfoFromLocalStorage() {
    const username = localStorage.getItem('username');
    const avatar = localStorage.getItem('avatar');
    const isLoggedIn = Boolean(username);

    return { username, avatar, isLoggedIn };
}

// Function to update the navbar based on the login status
function updateNavbar(isLoggedIn, username, avatar) {
    if (isLoggedIn) {
        loginInfo.innerHTML = `<img src="${avatar}" alt="User avatar"> Welcome! \n<br> Logged in as: \n<br> ${username}`;
        loginInfo.style.display = 'flex';
        loginInfo.style.textAlign = 'right';
       

        [elements.signupBtn, elements.loginBtn].forEach(btn => {
            if (btn) {
                btn.style.display = 'none';
            }
        });

        [elements.logoutBtn, elements.likesBtn].forEach(btn => {
            if (btn) {
                btn.style.display = 'block';
            }
        });
    } else if (loginInfo && elements.signupBtn && elements.loginBtn) {
        loginInfo.style.display = 'none';
        elements.signupBtn.style.display = 'block';
        elements.loginBtn.style.display = 'block';
    }
};

// Function to run when the page loads
window.onload = function () {
    const { username, avatar, isLoggedIn } = getAuthInfoFromLocalStorage();

    updateNavbar(isLoggedIn, username, avatar);

    // Add event listeners to elements
    addEventListenerToElement(elements.likeButton, 'click', function () {
        const token = localStorage.getItem('jwt');
        if (token) {
            elements.likeButton.classList.add("like-dark");
        } else if (elements.myModal) {
            elements.myModal.style.display = "block";
        }
    });

    addEventListenerToElement(span, 'click', function () {
        if (elements.myModal) {
            elements.myModal.style.display = "none";
        }
    });

    window.addEventListener('click', function (event) {
        if (event.target == elements.myModal) {
            elements.myModal.style.display = "none";
        }
    });

    addEventListenerToElement(elements.logoutBtn, 'click', function () {
        // Clear local storage
        localStorage.removeItem('jwt');
        localStorage.removeItem('username');
        localStorage.removeItem('avatar');

        // Redirect to homepage
        window.location.href = "/";
    });

    // Add event listeners to search button and search input
    elements.searchButton.addEventListener('click', performSearch);

    elements.searchInput.addEventListener('keyup', function (event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });
}

// Function to perform a search
function performSearch() {
    const query = elements.searchInput.value;
    fetch(`https://images-api.nasa.gov/search?q=${query}`)
        .then(response => response.json())
        .then(data => {
            elements.searchResults.innerHTML = '';
            data.collection.items.forEach(item => {
                const img = document.createElement('img');
                img.src = item.links[0].href;

                const title = document.createElement('h2');
                title.textContent = item.data[0].title;

                const description = document.createElement('p');
                description.textContent = item.data[0].description;

                const likeButton = document.createElement('button');
                likeButton.textContent = 'Like';
                likeButton.classList.add('like-button');

                likeButton.addEventListener('click', function () {
                    const token = localStorage.getItem('jwt');
                    if (token) {
                        likeButton.classList.add("like-dark");

                        // Send a POST request to the server with the ID of the liked object
                        fetch('/api/user/like', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ apiObjectId: item.data[0].nasa_id }) // Assuming the ID is stored in `nasa_id`
                        })
                            .then(response => response.json())
                            .then(data => console.log(data))
                            .catch(error => console.error('Error:', error));
                    } else if (elements.myModal) {
                        elements.myModal.style.display = "block";
                    }
                });

                const itemContainer = document.createElement('div');
                itemContainer.classList.add('article');
                itemContainer.append(img, title, description, likeButton);

                elements.searchResults.appendChild(itemContainer);
            });
        });
}

// Login function
async function handleLogin(event) {
    event.preventDefault();

    const { email: { value: email }, password: { value: password } } = loginForm;

    // Validate email and password
    if (!email || !password) {
        alert('Please enter a valid email and password.');
        return;
    }

    try {
        // Send a POST request to the server for user login
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password }) // Removed avatar from here
        });

        switch (response.status) {
            case 401:
                alert('Incorrect email or password.');
                return;
            case 500:
                alert('Server error. Please try again later.');
                return;
            default:
                if (!response.ok) {
                    alert('Login request failed.');
                    return;
                }
        }

        const responseData = await response.json();

        // Validate server response
        if (!responseData || !responseData.token) {
            alert('Invalid server response.');
            return;
        }



        // Store the JWT token username and avatar in localStorage
        localStorage.setItem('jwt', responseData.token);
        localStorage.setItem('username', responseData.username);
        localStorage.setItem('avatar', responseData.avatar)

        alert(responseData.message);

        // Update the navbar to reflect the logged-in state
        updateNavbar(true, responseData.username, responseData.avatar);

        // Hide the modal
        elements.myModal.style.display = "none";
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again later.');
    }
}

loginForm.addEventListener('submit', handleLogin);

// Signup
async function handleSignup(username, email, password) {
    const avatar = avatars[Math.floor(Math.random() * avatars.length)];

    // Check if avatar is defined and not null
    if (!avatar) {
        throw new Error('Failed to select an avatar.');
    }

    const response = await fetch('/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password, avatar })
    });

    if (response.status === 409) {
        throw new Error('A user with this username or email already exists.');
    }

    if (!response.ok) {
        throw new Error(`Signup request failed: ${response.statusText}`);
    }

    const data = await response.json();


    // Return the user's token
    return data.token;
}
elements.signupForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const username = elements.signupForm.username.value;
    const email = elements.signupForm.email.value;
    const password = elements.signupForm.password.value;
    const avatar = avatars[Math.floor(Math.random() * avatars.length)];

    try {
        const token = await handleSignup(username, email, password);


        // Store the user's token and username in localStorage
        localStorage.setItem('jwt', token);
        localStorage.setItem('username', username);
        localStorage.setItem('avatar', avatar);

        // Update the navbar to reflect the logged-in state
        updateNavbar(true, username, avatar);

        alert('User created and logged in successfully.');

        // Hide the modal
        elements.myModal.style.display = "none";
    } catch (error) {
        console.error('Error:', error);
        alert(`An error occurred: ${error.message}. Please try again later.`);
    }
});


const closeBtn = document.getElementsByClassName("close")[0];

// When the user clicks on the button, open the modal
document.getElementById("signupBtn").onclick = function () {
    modal.style.display = "block";
    signupForm.style.display = "none";
    loginForm.style.display = "block";
    switchBtn.textContent = "Sign Up";
}

document.getElementById("loginBtn").onclick = function () {
    modal.style.display = "block";
    signupForm.style.display = "block";
    loginForm.style.display = "none";
    switchBtn.textContent = "Log In";
}

switchBtn.onclick = function () {
    if (signupForm.style.display === "none") {
        signupForm.style.display = "block";
        loginForm.style.display = "none";
        switchBtn.textContent = "Log In";
    } else {
        signupForm.style.display = "none";
        loginForm.style.display = "block";
        switchBtn.textContent = "Sign Up";
    }
}

// When the user clicks on <span> (x), close the modal
closeBtn.onclick = function () {
    modal.style.display = "none";
}
// Function to fetch data from NASA API and display it on the home page as a hero section
async function fetchAndDisplayHeroSection() {
    const date = new Date().toISOString().slice(0,10); // Get today's date in YYYY-MM-DD format
    const apiKey = 'DEMO_KEY'; // Replace with your actual NASA API key

    try {
        const response = await fetch(`https://api.nasa.gov/planetary/apod?date=${date}&api_key=${apiKey}`);
        if (!response.ok) {
            throw new Error('Failed to fetch data from NASA API.');
        }
        const data = await response.json();
        heroSection.insertAdjacentHTML('beforeend', `
            <div class="hero-image" style="background-image: url('${data.url}')">
                <div class="hero-text">
                    <h1>${data.title}</h1>
                    <p>${data.explanation}</p>
                </div>
            </div>
        `);

        // Add event listener to the hero image
        const heroImage = document.querySelector('.hero-image');
        const heroText = document.querySelector('.hero-text');
        heroImage.addEventListener('click', () => {
            heroText.classList.toggle('hidden');
        });
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while fetching data from NASA API.');
    }
}

// Call the function to fetch and display the hero section
fetchAndDisplayHeroSection();