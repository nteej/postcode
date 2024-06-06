const baseurl = "http://localhost:4000/";

// Initialize the Leaflet map
const map = L.map('map', {
    center: [6.8711724, 79.9237776],
    zoom: 13,
    zoomControl: false,
    attributionControl: false
});

const nzoom = 12;

// Add Google Maps tile layer
L.tileLayer('http://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
}).addTo(map);

// Add zoom and scale controls
L.control.zoom({ position: 'bottomright' }).addTo(map);
L.control.scale({ position: 'bottomleft' }).addTo(map);

// Define the marker icon
const postcodeIcon = L.icon({
    iconUrl: './favicon.ico',
    iconSize: [50, 50]
});

// Initialize the marker
const marker = L.marker([6.8711724, 79.9237776], {
    icon: postcodeIcon,
    draggable: true
}).addTo(map);

// Get current geolocation and update the map
navigator.geolocation.getCurrentPosition(onGeolocationSuccess, onGeolocationError);

// Geolocation success callback
function onGeolocationSuccess(position) {
    const { latitude, longitude } = position.coords;
    setMarkerPosition(latitude, longitude, marker);
    map.setView([latitude, longitude], 13);
    document.getElementById('lat_long').value = `${latitude},${longitude}`;
}

// Geolocation error callback
function onGeolocationError(error) {
    if (error.code === error.PERMISSION_DENIED) {
        console.log("Location permission not allowed.");
    }
}

// Handle marker drag end event
marker.on('dragend', function () {
    const { lat, lng } = marker.getLatLng();
    const currentZoom = map.getZoom();
    const newZoom = Math.min(currentZoom + 2, 18);

    map.setView([lat, lng], currentZoom !== 18 ? newZoom : currentZoom);

    document.getElementById('latitude').value = lat;
    document.getElementById('longitude').value = lng;
    document.getElementById('lat_long').value = `${lat},${lng}`;

    getAddressFromCoordinates(lat, lng, marker);
});

// Function to set marker position and update the map view
function setMarkerPosition(lat, lng, marker) {
    const newLatLng = new L.LatLng(lat, lng);
    marker.setLatLng(newLatLng);
    map.setView(newLatLng, map.getZoom());
}

// Function to get address from coordinates using Nominatim API
function getAddressFromCoordinates(lat, lng, marker) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
        .then(response => response.json())
        .then(data => {
            marker.bindPopup(data.display_name).openPopup();
        })
        .catch(error => {
            console.error('Error fetching address:', error);
        });
}

// Initialize autocomplete for address search
const autoCompleteJS = new autoComplete({
    placeHolder: "Search your address here ...",
    threshold: 5,
    resultsList: {
        maxResults: 10,
        noResults: true,
    },
    data: {
        src: async (query) => {
            try {
                const response = await fetch(`https://www.postalcode.lk/api/v2/locations?search=${query}`);
                const data = await response.json();
                return data;
            } catch (error) {
                return error;
            }
        },
        keys: ["location"],
    },
    resultItem: {
        highlight: true,
    },
    resultsList: {
        element: (list, data) => {
            if (!data.results.length) {
                const message = document.createElement("div");
                message.setAttribute("class", "no_result");
                message.style.overflow = "hidden";
                message.innerHTML = `
                    <span>
                        <p>Your searched address "${data.query}" is not available. Would you like to request now?</p>
                        <a id="btnPCRequest" tabindex="1" onclick="hideMessage()" class="btn btn-primary" href="#pcrequest" data-bs-toggle="collapse" style="margin-left:10px;padding:2px;min-width:100px;height:30px">Yes</a>
                    </span>`;
                list.appendChild(message);
                $('#btnPCRequest').focus();
            }
        },
        noResults: true,
    },
    events: {
        input: {
            selection: (event) => {
                const { location, lat_long } = event.detail.selection.value;
                document.getElementById('lat_long').value = lat_long;
                autoCompleteJS.input.value = location;
                setMarker(lat_long, 18, location);
                document.getElementById('address').value = location;
            },
        },
    },
});

// Form validation setup
(() => {
    'use strict';

    const forms = document.querySelectorAll('.needs-validation');

    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }

            form.classList.add('was-validated');
        }, false);
    });
})();
// Function to handle form submission
function send(e, form) {
    if (!form.checkValidity()) {
        showAlerts('fail',  'Please fill the missing values before submit.');
        console.log('validation fails');
        e.preventDefault()
        e.stopPropagation()
    } else {
        fetch(form.action, { method: 'post', body: new FormData(form) })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network error');
                }
                return response.json();
            })
            .then((json) => {
                console.log(json.id);
                if (json.data.id > 0) {
                    showAlerts('success', 'New PostCode requested sucessfully.Your registered postcode will be available with 5 working days.');
                    form.reset();
                    form.classList.remove('was-validated');
                    // document.getElementById("address").value='';
                    // document.getElementById("customer").value='';
                    // document.getElementById("lat_long").value='';
                }

            })
            .catch(error => {
                if (error instanceof TypeError && error.message) {
                    console.error('Error occured: ', error);
                } else {
                    console.error('There was a problem with the Fetch operation:', error);
                }
                showAlerts('fail',  error);
            });


        e.preventDefault();
    }

}



// Function to show alert messages
function showAlert(type, message) {
    const notification = document.getElementById('notification');
    notification.className = 'alert';
    notification.classList.add(type === 'success' ? 'alert-success' : 'alert-danger');
    notification.innerHTML = message;
    notification.style.display = 'block';
    setTimeout(() => { notification.style.display = 'none'; }, 5000);
}

// Check if URL has 'locate' parameter and set marker accordingly
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('locate')) {
    const postcode = urlParams.get('locate');
    locate(postcode);
}

// Function to locate postcode and set marker
function locate(postcode) {
    fetch(`https://www.postalcode.lk/api/v2/locate?postcode=${postcode}`)
        .then(response => response.json())
        .then(data => {
            if (data) {
                setMarker(data.lat_long, 14, `<b>${data.customer}</b><br>${data.address}`);
            }
        })
        .catch(error => {
            console.error('Error fetching postcode:', error);
        });
}

// Close popup on body click
document.body.addEventListener("click", () => {
    map.closePopup();
}, true);

// Function to hide 'No Results' message
function hideMessage() {
    document.querySelector(".no_result").style.display = 'none';
}

// Copy share link to clipboard
document.getElementById('copyButton').addEventListener('click', () => {
    const copyText = document.getElementById('shareLink');
    copyText.select();
    copyText.setSelectionRange(0, 99999); // For mobile devices

    navigator.clipboard.writeText(copyText.value).then(() => {
        alert(`Copied the text: ${copyText.value}`);
    }, (err) => {
        console.error('Failed to copy text: ', err);
    });
});

// Add event listener to the "Yes" button
document.getElementById('btnPCRequest').addEventListener('click', function() {
    // Add class to enable scrolling and expand height
    document.getElementById('pcrequest').classList.add('expanded');
});
// Add event listener for the "Track Location" button
document.getElementById('nav-track-location').addEventListener('click', trackLocation);

// Function to track live location
function trackLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(onLiveLocationSuccess, onLiveLocationError, { enableHighAccuracy: true });
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
}

// Live location success callback
function onLiveLocationSuccess(position) {
    const { latitude, longitude } = position.coords;
    setMarkerPosition(latitude, longitude, marker);
    map.setView([latitude, longitude], 13);
    document.getElementById('lat_long').value = `${latitude},${longitude}`;
}

// Live location error callback
function onLiveLocationError(error) {
    console.log("Error getting live location:", error.message);
}

