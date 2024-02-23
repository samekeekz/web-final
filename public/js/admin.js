document.getElementById('addItemForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    const newItem = {
        name: document.getElementById('name').value,
        description: document.getElementById('description').value,
        pictures: [
            document.getElementById('picture1').value,
            document.getElementById('picture2').value,
            document.getElementById('picture3').value
        ]
    };
    await addItem(newItem);
});

async function addItem(item) {
    try {
        const response = await axios.post('/items', item);
        console.log(response.data); // Handle success response
        // You can also update the UI here if needed
    } catch (error) {
        console.error('Error adding item:', error);
    }
}

// Function to fetch players data from the server
async function fetchPlayers() {
    try {
        const response = await axios.get('/players');
        return response.data.players;
    } catch (error) {
        console.error('Error fetching players:', error);
        return [];
    }
}

// Function to render players data on the page
async function renderPlayers() {
    const players = await fetchPlayers();
    const playerList = document.querySelector('ul');

    playerList.innerHTML = ''; // Clear existing player list

    players.forEach(player => {
        const li = document.createElement('li');
        li.innerHTML = `
            <h2>${player.name}</h2>
            <p>${player.description}</p>
            <div class="carousel">
                ${player.pictures.map(picture => `<img src="${picture}" alt="Player Image">`).join('')}
            </div>
            <p>Created At: ${player.createdAt}</p>
            <p>Updated At: ${player.updatedAt}</p>
            <button class="editButton">Edit</button>
            <button class="deleteButton">Delete</button>
        `;
        playerList.appendChild(li);
    });
}

// Call the renderPlayers function when the page loads
window.onload = renderPlayers;
