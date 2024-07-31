const socket = io();

const userName = prompt("Please enter your name:");

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
  
  const userStatus = {};

  socket.on("receive-location", (data) => {
    const { id, userName } = data;
    userStatus[id] = 'online';
    updateUserStatus();
  });

  socket.on("user-disconnect", (id) => {
    userStatus[id] = 'offline';
    updateUserStatus();
  });

  function updateUserStatus() {
    for (const id in userStatus) {
      const status = userStatus[id];
      // Update the UI to reflect the user's status
    }
  }
});

const userCountElement = document.createElement("div");
userCountElement.id = "user-count";
document.body.appendChild(userCountElement);

socket.on("update-user-count", (count) => {
  userCountElement.textContent = `Online Users: ${count}`;
});

document.getElementById("theme-toggle").addEventListener("click", () => {
  const currentTheme = map.hasLayer(lightTheme) ? lightTheme : darkTheme;
  const newTheme = currentTheme === lightTheme ? darkTheme : lightTheme;
  map.removeLayer(currentTheme);
  L.tileLayer(newTheme, { attribution: "Harsh's Map" }).addTo(map);
});