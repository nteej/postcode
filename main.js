var map = L.map('map',{
    center:[51.505, -0.09],
    zoom:13,
    zoomControl:false,
    attributionControl:false
});
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png?{foo}', {}).addTo(map);
var marker = L.marker([51.5, -0.09]).addTo(map);