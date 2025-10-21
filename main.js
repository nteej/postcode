
var baseurl = "http://localhost:4000/";
// Initialize the Leaflet map
var map = L.map('map', {
    center: [6.8711724, 79.9237776],
    zoom: 13,
    zoomControl: false,
    attributionControl: false
});
var nzoom = 12;

// Add Google Maps tile layer
L.tileLayer('http://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    //foo: 'bar',
    //attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
L.control.zoom({
    position: 'bottomright'
}).addTo(map);
L.control.scale({ position: 'bottomleft' }).addTo(map);
// Define the marker icon
var postcode = L.icon({
    iconUrl: './favicon.ico',
    iconSize: [50, 50]
});
// Initialize the marker
var marker = L.marker([6.8711724, 79.9237776], {
    icon: postcode,
    draggable: true
}).addTo(map);
navigator.geolocation.getCurrentPosition(function (position) {
    console.log(position);
    const { coords: { latitude, longitude } } = position;
    getAddressFromCoordinates(latitude, longitude, marker);
    marker.setLatLng([latitude, longitude])
    map.setView([latitude, longitude], 13)
    document.getElementById('lat_long').value = latitude + ',' + longitude;
    // Show Google Maps button and set URL for current location
    const latLng = latitude + ',' + longitude;
    $("#google-map").attr("href", "https://www.google.com/maps/dir/?api=1&destination="+latLng);
    $("#google-map").show();
    $("#navigate").attr("href","https://www.google.com/maps/dir/?api=1&destination="+latLng);
   // document.getElementById('address').value = latitude + ',' + longitude;
    //console.log(marker);
}, function (error) {
    if (error.code == error.PERMISSION_DENIED)
        console.log("Location permission not allowed.");
});

// Handle marker drag end event
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
    document.getElementById('lat_long').value = lat + ',' + lng;
    // Show Google Maps button and set URL for dragged location
    const latLng = lat + ',' + lng;
    $("#google-map").attr("href", "https://www.google.com/maps/dir/?api=1&destination="+latLng);
    $("#google-map").show();
    $("#navigate").attr("href","https://www.google.com/maps/dir/?api=1&destination="+latLng);
    getAddressFromCoordinates(lat, lng, marker);



});
// Function to set marker position and update the map view
function setMarker(latLng, zoom, intimessage) {
    // Split the string into an array using the comma as a separator
    const [latitude, longitude] = latLng.split(',');
    $("#google-map").attr("href", "https://www.google.com/maps/dir/?api=1&destination="+latLng);
    $("#google-map").show(); // Show the Google Maps button when a location is selected
    $("#navigate").attr("href","https://www.google.com/maps/dir/?api=1&destination="+latLng);
    // Convert the values to numbers if needed
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    var newLatLng = new L.LatLng(lat, lng);
    marker.setLatLng(newLatLng);
    //L.circle(newLatLng,{radius:100}).addTo(map);
    marker.bindPopup(intimessage).openPopup();
    map.setView([lat, lng], zoom);

}

function getAddressFromCoordinates(lat, lng, marker) {
    fetch("https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" + lat + "&lon=" + lng)
        .then((response) => response.json())
        .then((json) => {
            // console.log(json.results[0].formatted_address);
            marker.bindPopup(json.display_name).openPopup();
            // marker.bindPopup("Lat " + lat + "<br />Lon " + lng + "</br>address " + json.results[0].formatted_address).openPopup();
           // document.getElementById('address').value = json.display_name;
        })
        .catch(error => {
            console.error('Error fetching address:', error);
        });
}
// Google Places Autocomplete variables
let autocomplete;

// Initialize Google Places Autocomplete
function initAutocomplete() {
    const input = document.getElementById('autoComplete');
    
    // Create the autocomplete object
    autocomplete = new google.maps.places.Autocomplete(input, {
        types: ['establishment', 'geocode'],
        fields: ['place_id', 'geometry', 'name', 'formatted_address']
    });

    // Remove Google attribution after autocomplete is initialized
    setTimeout(() => {
        hideAttributionElements(document);
    }, 100);

    // Listen for place selection
    autocomplete.addListener('place_changed', function() {
        const place = autocomplete.getPlace();
        
        if (!place.geometry || !place.geometry.location) {
            // User didn't select a place from the dropdown
            console.log("No details available for input: '" + place.name + "'");
            
            // Fall back to the original autocomplete implementation
            initOriginalAutocomplete();
            return;
        }

        // Get coordinates
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const latLng = `${lat},${lng}`;
        
        // Update form values
        document.getElementById('lat_long').value = latLng;
        document.getElementById('address').value = place.formatted_address || place.name;
        
        // Update map
        setMarker(latLng, 18, place.formatted_address || place.name);
        
        console.log('Google Places result:', place);
    });

    // Set placeholder
    input.placeholder = "Search your address here with Google Places...";
}

// Initialize the original autocomplete as fallback
function initOriginalAutocomplete() {
    // Initialize autocomplete for address search (original implementation)
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
                    // Fetch Data from external Source
                    const source = await fetch(`https://www.postalcode.lk/api/v2/locations?search=${query}`);
                    // Data should be an array of `Objects` or `Strings`
                    const data = await source.json();
                    return data;
                } catch (error) {
                    return error;
                }
            },
            // Data source 'Object' key to be searched
            keys: ["location"],
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
                    message.innerHTML = `<span><p>Your searched address "${data.query}" is not available. Would you like to request now?</p><a id="btnPCRequest" tabindex="1" onclick="hideMessage()" class="btn btn-primary" href="#pcrequest" data-bs-toggle="collapse" style="margin-left:10px;padding:2px;min-width:100px;height:30px">Yes</a> </span>`;
                    // Add message list element to the list
                    list.appendChild(message);
                   // $("#btndivform").hide();
                    //const bsCollapse = new bootstrap.Collapse('#pcrequest', {
                    //    show: true
                    //})
                   
                    $('#btnPCRequest').focus();
                

                }
            },
            noResults: true,
        },
        events: {
            input: {
                selection: (event) => {
                    const selection = event.detail.selection.value.location;
                    let latLng = event.detail.selection.value.lat_long;
                    document.getElementById('lat_long').value = latLng;
                    autoCompleteJS.input.value = selection;
                    setMarker(latLng, 18, selection);
                    document.getElementById('address').value = selection;
                    //const [lat, lng] = latLng.split(',');
                    //getAddressFromCoordinates(lat, lng, marker);
                },
            },
        },
    });
    
    return autoCompleteJS;
}

// Form validation setup
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
                    // Scroll to the top of the form after successful submission
                    scrollToTopRepeatedly(3);
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
    function scrollToTopRepeatedly(times) {
        let count = 0;
        function scroll() {
            if (count < times) {
                document.getElementById('pcformrequest').scrollIntoView({ behavior: 'smooth', block: 'start' });
                count++;
                setTimeout(scroll, 500); // Adjust timeout as needed to ensure smooth scrolling
            }
        }
        scroll();
    }

}
// Function to show alert messages
function showAlerts(type, message) {
    if (type == "success") {
        document.getElementById('notification').classList.add('alert-success');

    } else if (type == "fail") {
        document.getElementById('notification').classList.add('alert-danger');
        type = "";
    }
    else {
        document.getElementById('notification').classList.add('alert-primary');
    }
    document.getElementById("notification").innerHTML = message;
    document.getElementById('notification').style.display = 'block';
    setTimeout(function () { document.getElementById('notification').style.display = 'none' }, 5000);

}

const urlParams = new URLSearchParams(window.location.search);
if(urlParams.has('locate')){
    const postcode = urlParams.get('locate');
    $lat_long=locate(postcode);
    console.log(postcode);
}
// Check if URL has 'locate' parameter and set marker accordingly
function locate(postcode){
    fetch("https://www.postalcode.lk/api/v2/locate?postcode="+postcode)
    .then((response) => response.json())
    .then((json) => {
        if(json){
            setMarker(json.lat_long, 14, "<b>"+json.customer+"</b></br>"+json.address);
        }else{
            
        }
        
    })
    .catch(error => {
        console.error('Error fetching postcode:', error);
    });
}
document.body.addEventListener("click", function (evt) {
    //console.dir(this);
    //note evt.target can be a nested element, not the body element, resulting in misfires
    //console.log(evt.target);
    map.closePopup();
},true);
// Function to hide 'No Results' message
function hideMessage(){
    $(".no_result").hide();
}
$("#infopanel").scrollTop($("#infopanel")[0].scrollHeight);
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

// Ensure Google Maps button is hidden on page load
$(document).ready(function() {
    $("#google-map").hide();
    
    // Remove Google attribution from autocomplete dropdown
    removeGoogleAttribution();
});

// Function to remove Google attribution elements
function removeGoogleAttribution() {
    // Set up a mutation observer to catch dynamically added attribution
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    hideAttributionElements(node);
                }
            });
        });
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Initial cleanup
    hideAttributionElements(document);
}

// Function to hide attribution elements
function hideAttributionElements(container) {
    // Hide various Google attribution elements
    const selectors = [
        '.pac-logo',
        '.pac-footer',
        'div[title*="Powered by Google"]',
        'a[href*="maps.google.com/local_url"]',
        'img[src*="powered"]',
        'img[alt*="Google"]',
        '.pac-container a[href*="google.com"]',
        '.pac-container div[role="img"]'
    ];
    
    selectors.forEach(selector => {
        const elements = container.querySelectorAll ? container.querySelectorAll(selector) : [];
        elements.forEach(element => {
            element.style.display = 'none';
            element.style.visibility = 'hidden';
            element.style.height = '0';
            element.style.overflow = 'hidden';
        });
    });
}