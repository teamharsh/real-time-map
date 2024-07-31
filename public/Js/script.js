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

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "Harsh's Map",
}).addTo(map);

const markers = {};

socket.on("receive-location", (data) => {
  const { latitude, longitude, id, userName } = data;
  map.setView([latitude, longitude], 16);
  const popupContent = `<p class="popup-content">${userName}</p>`;
  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
    markers[id].bindPopup(popupContent).openPopup();
  } else {
    markers[id] = L.marker([latitude, longitude])
      .addTo(map)
      .bindPopup(popupContent)
      .openPopup();
  }
});

socket.on("user-disconnect", (id) => {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
  }
});

const userCountElement = document.createElement("div");
userCountElement.id = "user-count";
document.body.appendChild(userCountElement);

socket.on("update-user-count", (count) => {
  userCountElement.textContent = `Online Users: ${count}`;
});