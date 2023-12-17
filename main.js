
var map = L.map('map', {
    center: [6.8711724, 79.9237776],
    zoom: 13,
    zoomControl: false,
    attributionControl: false
});
var nzoom = 12;


L.tileLayer('http://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    //foo: 'bar',
    //attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var postcode = L.icon({
    iconUrl: './favicon.ico',
    iconSize: [50, 50]
});
var marker = L.marker([6.8711724, 79.9237776], {
    icon: postcode,
    draggable: true
}).addTo(map);
marker.on('dragend', function (e) {
    console.log(marker);
    var lat = marker.getLatLng().lat;//.toFixed(8);
    var lng = marker.getLatLng().lng;//.toFixed(8);
    var czoom = map.getZoom();
    if (czoom < 18) { nzoom = czoom + 2; }
    if (nzoom > 18) { nzoom = 18; }
    if (czoom != 18) { map.setView([lat, lng], nzoom); } else { map.setView([lat, lng]); }
    document.getElementById('latitude').value = lat;
    document.getElementById('longitude').value = lng;
    getAddressFromCoordinates(lat, lng, marker);



});

function setMarker(latLng, zoom) {
    // Split the string into an array using the comma as a separator
    const [latitude, longitude] = latLng.split(',');

    // Convert the values to numbers if needed
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    var newLatLng = new L.LatLng(lat, lng);
    marker.setLatLng(newLatLng);
    map.setView([lat, lng], zoom);
}

function getAddressFromCoordinates(lat, lng, marker) {
    fetch("https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" + lat + "&lon=" + lng)
        .then((response) => response.json())
        .then((json) => {
            // console.log(json.results[0].formatted_address);
            marker.bindPopup(json.display_name).openPopup();
            // marker.bindPopup("Lat " + lat + "<br />Lon " + lng + "</br>address " + json.results[0].formatted_address).openPopup();
            document.getElementById('address').value = json.display_name;
        })
        .catch(error => {
            console.error('Error fetching address:', error);
        });
}
const autoCompleteJS = new autoComplete({
    placeHolder: "Search for Postcode...",
    threshold: 2,
    resultsList: {
        maxResults: 10,
        noResults: true,
    },
    data: {
        src: async (query) => {
            try {
                // Fetch Data from external Source
                const source = await fetch(`https://devapi.cc/api/locations?search=${query}`);
                // Data should be an array of `Objects` or `Strings`
                const data = await source.json();
                return data;
            } catch (error) {
                return error;
            }
        },
        // Data source 'Object' key to be searched
        keys: ["address"],
    },
    resultItem: {
        highlight: true,
    },
    resultsList: {
        element: (list, data) => {
            if (!data.results.length) {
                // Create "No Results" message list element
                const message = document.createElement("div");
                message.setAttribute("class", "no_result");
                // Add message text content
                message.innerHTML = `<span class="not_found">Found No Results for "${data.query}"</span>`;
                // Add message list element to the list
                list.appendChild(message);
                const bsCollapse = new bootstrap.Collapse('#pcrequest', {
                    show: true
                })

            }
        },
        noResults: true,
    },
    events: {
        input: {
            selection: (event) => {
                const selection = event.detail.selection.value.address;
                let latLng = event.detail.selection.value.lat_long;
                document.getElementById('lat_long').value = latLng;
                autoCompleteJS.input.value = selection;
                setMarker(latLng, 18);

            },
        },
    },
});

// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
    'use strict'

    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.needs-validation')

    // Loop over them and prevent submission
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault()
                event.stopPropagation()
            }

            form.classList.add('was-validated')
        }, false)
    })
})()