const socket = io();

const userName = prompt("Please enter your name:");

if (Notification.permission === "default") {
  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      console.log("Notification permission granted.");
    }
  });
}

if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      socket.emit("send-location", { latitude, longitude, userName });
    },
    (error) => {
      console.log(error);
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }
  );
}

const map = L.map("map").setView([0, 0], 10);

const lightTheme = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const darkTheme = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png";

L.tileLayer(lightTheme, {
  attribution: "Harsh's Map",
}).addTo(map);

const markers = {};
const locationHistory = {};
const userStatus = {};

socket.on("receive-location", (data) => {
  const { latitude, longitude, id, userName } = data;
  map.setView([latitude, longitude], 16);
  const popupContent = `<div class="popup-content"><img src="/to/avatar.png" alt="avatar" class="avatar"><p>${userName}</p></div>`;
  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
    markers[id].bindPopup(popupContent).openPopup();
  } else {
    const customIcon = L.icon({
      iconUrl: 'to/pin.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });
    
    markers[id] = L.marker([latitude, longitude], { icon: customIcon })
      .addTo(map)
      .bindPopup(popupContent)
      .openPopup();
  }

  if (!locationHistory[id]) {
    locationHistory[id] = [];
  }
  locationHistory[id].push([latitude, longitude]);

  // Draw polyline for location history
  if (locationHistory[id].length > 1) {
    L.polyline(locationHistory[id], { color: 'blue' }).addTo(map);
  }
  
  userStatus[id] = { status: 'online', userName };
  updateUserStatus();
});

socket.on("user-disconnect", (id) => {
  if (userStatus[id]) {
    userStatus[id].status = 'offline';
    updateUserStatus();
  }
});

function updateUserStatus() {
  for (const id in userStatus) {
    const status = userStatus[id];
    // Update the UI to reflect the user's status
  }
}

function showOnlineUsers() {
  const onlineUsers = Object.values(userStatus)
    .filter(user => user.status === 'online')
    .map(user => user.userName);

  userListContainer.innerHTML = ""; // Clear previous list

  onlineUsers.forEach(userName => {
    const userItem = document.createElement("div");
    userItem.textContent = userName;
    userListContainer.appendChild(userItem);
  });

  // Toggle visibility
  userListContainer.style.display = userListContainer.style.display === "none" ? "block" : "none";
}

const userCountElement = document.createElement("div");
userCountElement.id = "user-count";
document.body.appendChild(userCountElement);

const userListContainer = document.createElement("div");
userListContainer.id = "user-list";
userListContainer.style.display = "none"; // Initially hidden
document.body.appendChild(userListContainer);

userCountElement.addEventListener("click", showOnlineUsers);

socket.on("update-user-count", (count) => {
  userCountElement.textContent = `Online Users: ${count}`;
});

// Chat functionality
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const sendButton = document.getElementById("send-button");

function sendMessage() {
  const message = chatInput.value;
  if (message.trim()) {
    socket.emit("send-message", { userName, message });
    chatInput.value = "";
  }
}

sendButton.addEventListener("click", sendMessage);

chatInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    sendMessage();
  }
});

socket.on("receive-message", (data) => {
  const { userName, message } = data;
  const messageElement = document.createElement("div");
  messageElement.textContent = `${userName}: ${message}`;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom

  // Show notification
  if (Notification.permission === "granted") {
    new Notification(`${userName} says:`, {
      body: message,
      icon: "/to/avatar.png", // Optional: path to an icon
    });
  }
});