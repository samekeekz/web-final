const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');

signUpButton.addEventListener('click', () => {
    container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
    container.classList.remove("right-panel-active");
});

registerForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(registerForm);

    const username = formData.get('username');
    const password = formData.get('password');
    if (username.length < 3 || password.length < 3) {
        alert("Username and password must be at least 3 characters long.");
        return;
    }
    handleSignUp({ username, password });
})

loginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);

    const username = formData.get('username');
    const password = formData.get('password');

    if (username.length < 3 || password.length < 3) {
        alert("Username and password must be at least 3 characters long.");
        return;
    }

    handleSignIn({ username, password });
})

async function handleSignUp(data) {
    fetch("/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            alert(data.message);
            registerForm.reset();
            container.classList.remove("right-panel-active");

        });

    return false
}

async function handleSignIn(data) {
    fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            if (data.success) {
                alert(`Login successful! Welcome ${data.username}.`);
                window.location.href = data.redirectUrl;
            } else {
                alert(data.error);
            }
        })
        .catch((error) => {
            console.error("Error:", error);
            alert("An error occurred. Please try again later.");
        });

    return false;
}