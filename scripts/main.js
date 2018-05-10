// Google Maps Javascript API key: AIzaSyBNBO04zSveUymLn4nS5LYIVCRPTc2zMLk

const app = {};

app.availableBikes = [];

app.availableSlots = [];

app.events = () => {

    const locationPromise = new Promise((resolve, reject) => {
        navigator.geolocation.watchPosition(function (pos) {

            resolve(pos);

        })
    })

    locationPromise.then((pos) => {

        const lat1 = pos.coords.latitude

        const lng1 = pos.coords.longitude

        app.getMap(lat1, lng1)

        app.getMarkers(lat1, lng1)

    })

}

const cityBikesURL = 'http://api.citybik.es/v2/networks/bixi-toronto';

app.getLocations = () => {
    $.ajax({
        url: cityBikesURL,
        method: 'GET',
        dataType: 'json',
        data: {
            'fields': 'stations'
        }
    }).then((res) => {
        const stations = res.network.stations;
        app.setLocations(stations);
    });
}

app.markers = [];

app.setLocations = (stations) => {
    stations.forEach((location) => {
        const marker = new google.maps.Marker({
            position: new google.maps.LatLng(location.latitude, location.longitude),
            map: app.map,
            icon: 'bicycle_marker.png',
            emptySlots: location.empty_slots,
            freeBikes: location.free_bikes

        });

        if (marker.emptySlots > 0) {
            app.availableSlots.push(marker);
        }
        if (marker.freeBikes > 0) {
            app.availableBikes.push(marker);
        }

        marker.distanceBetween = google.maps.geometry.spherical.computeDistanceBetween(marker.position, app.home.position)

        marker.infowindow = new google.maps.InfoWindow({
            content: `<div>
                            <p><strong>Location:</strong> ${location.name}</p>
                            <p><strong>Available Bikes:</strong> ${location.free_bikes}</p>
                            <p><strong>Empty Slots:</strong> ${location.empty_slots}</p>
                            <p><strong>Distance Between:</strong> ${Math.round(marker.distanceBetween)} metres</p></p>
                        </div>`
                })        

        app.markers.push(marker)

        marker.addListener('click', function () {
            app.markers.forEach((marker) => marker.infowindow.close())
            app.map.setZoom(17);
            app.map.setCenter(this.getPosition());
            this.infowindow.open(app.map, this);
        });
    });
}

app.getMarkers = (lat1, lng1) => {

    app.home = new google.maps.Marker({
        position: new google.maps.LatLng(lat1, lng1),
        map: app.map, // notice how we pass it the map we made earlier? This is how it knows which map to put the marker on
        icon: 'your_location_marker.png'
    });
}

app.getMap = function (lat1, lng1) {
    // Call current location, then input the position into a map object
    const mapOptions = {
        center: { lat: lat1, lng: lng1 },
        zoom: 17
    }

    const $mapDiv = $('#map')[0]

    app.map = new google.maps.Map($mapDiv, mapOptions);
    app.getLocations();
}

app.getNearestBike = () => {
    $(`#getBike`).on(`click`, function(e) {
        e.stopPropagation();
        const distances = app.availableBikes.map(function (item) {
            return item.distanceBetween
        })

        app.markers.forEach((marker) => marker.infowindow.close())

        const shortestDistance = Math.min(...distances)

        for (let i = 0; i < app.markers.length; i++) {
            if (app.markers[i].distanceBetween === shortestDistance) {

                app.map.setCenter(app.markers[i].getPosition());
                app.markers[i].infowindow.open(app.map, app.markers[i]);
            }
        }
    });

}

app.getNearestSlot = () => {
    $(`#getSlot`).on(`click`, function(e) {
        e.stopPropagation();

        app.markers.forEach((marker) => marker.infowindow.close())
        
        const distances = app.availableSlots.map(function(item) {
            return item.distanceBetween
        })

        const shortestDistance = Math.min(...distances)

        for (let i = 0; i < app.markers.length; i++) {
            if (app.markers[i].distanceBetween === shortestDistance) {
                // console.log();
                
                app.map.setCenter(app.markers[i].getPosition());
                app.markers[i].infowindow.open(app.map, app.markers[i]);
            }
        }
        
    });
}


app.init = () => {
    app.events()
    app.getNearestBike();
    app.getNearestSlot();
}

$(function () {
    // 4. call load map when the document is ready
    app.init()
});