
var baseurl = "http://localhost:4000/";
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
L.control.zoom({
    position: 'bottomright'
}).addTo(map);
L.control.scale({ position: 'bottomleft' }).addTo(map);

var postcode = L.icon({
    iconUrl: './favicon.ico',
    iconSize: [50, 50]
});
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
    document.getElementById('address').value = latitude + ',' + longitude;
    //console.log(marker);
}, function (error) {
    if (error.code == error.PERMISSION_DENIED)
        console.log("Location permission not allowed.");
});



//L.circle([6.8711724, 79.9237776],{radius:100}).addTo(map);
//var intimessage = "Drag me to position your address with coordination.";
//marker.bindPopup(intimessage).openPopup();

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
    getAddressFromCoordinates(lat, lng, marker);



});

function setMarker(latLng, zoom, intimessage) {
    // Split the string into an array using the comma as a separator
    const [latitude, longitude] = latLng.split(',');
    $("#google-map").attr("href", "https://www.google.com/maps/dir/?api=1&destination="+latLng);
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
            document.getElementById('address').value = json.display_name;
        })
        .catch(error => {
            console.error('Error fetching address:', error);
        });
}
const autoCompleteJS = new autoComplete({
    placeHolder: "Search your address here ...",
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
                message.innerHTML = `<span><p>Your searched address "${data.query}" is not available. Would you like to request now?</p><a onclick="hideMessage()" class="btn btn-primary" href="#pcrequest" data-bs-toggle="collapse" style="margin-left:10px;padding:2px;min-width:100px;height:30px">Yes</a> </span>`;
                // Add message list element to the list
                list.appendChild(message);
               // $("#btndivform").hide();
                //const bsCollapse = new bootstrap.Collapse('#pcrequest', {
                //    show: true
                //})
               
              
            

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
                if (json.id > 0) {
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
function showAlerts(type, message) {
    if (type == "success") {
        document.getElementById('notification').classList.add('alert-success');

    } else if (type == "fail") {
        document.getElementById('notification').classList.add('alert-danger');
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

function locate(postcode){
    fetch("https://devapi.cc/api/locate?postcode="+postcode)
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
    console.dir(this);
    //note evt.target can be a nested element, not the body element, resulting in misfires
    console.log(evt.target);
    map.closePopup();
},true);

function hideMessage(){
    $(".no_result").hide();
}