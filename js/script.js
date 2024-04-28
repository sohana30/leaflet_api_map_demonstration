(function () {
  var map = L.map("map").setView([49.2827, -123.1207], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  var drawnItems = new L.FeatureGroup().addTo(map);

  var drawControl = new L.Control.Draw({
    edit: {
      featureGroup: drawnItems,
    },
  }).addTo(map);

  // Define the red icon for search results
  var redIcon = L.icon({
    iconUrl: "icons/red-icon.png",
    iconSize: [41, 40],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  map.on(L.Draw.Event.CREATED, function (event) {
    var layer = event.layer;
    drawnItems.addLayer(layer);
    editFeatureText(layer);
  });

  // Function to open popup and edit feature text
  function editFeatureText(layer) {
    var text = layer.text || "";
    var popupContent = `
      <textarea id="featureText" rows="4" cols="25">${text}</textarea><br>
      <button class="save-button" id="saveButton" data-layer-id="${L.stamp(
        layer
      )}">Save</button>
    `;
    layer.bindPopup(popupContent).openPopup();

    // Listener for the Save button
    layer.on("popupopen", function () {
      var saveButton = document.getElementById("saveButton");
      var featureText = document.getElementById("featureText");
      saveButton.addEventListener("click", function () {
        saveFeatureText(saveButton.dataset.layerId);
      });
    });
  }

  // Function to save edited feature text
  function saveFeatureText(layerId) {
    var text = document.getElementById("featureText").value;
    var layer = drawnItems.getLayer(layerId);
    layer.text = text;

    // Update the popup content with the new text
    layer.getPopup().setContent(text);

    layer.closePopup();
    showFeatureText(layer); // Update label with new text
  }

  // Function to display feature text as label and on feature
  function showFeatureText(layer) {
    var text = layer.text || "";
    if (text) {
      var latlng;
      if (layer.getBounds) {
        var bounds = layer.getBounds();
        latlng = bounds.isValid() ? bounds.getCenter() : layer.getLatLng();
      } else {
        latlng = layer.getLatLng();
      }

      // Update label
      var existingLabel = drawnItems
        .getLayers()
        .find((l) => l.featureId === layer.featureId);
      if (existingLabel) {
        existingLabel.setLatLng(latlng).getElement().innerHTML = text;
      } else {
        var label = L.marker(latlng, {
          icon: L.divIcon({ className: "text-label", html: text }),
        }).addTo(map);
        label.featureId = layer.featureId;
        drawnItems.addLayer(label);
      }
    }

    // Update layer style
    layer.options.color = "yellow";
  }

  map.on("draw:created", function (e) {
    var layer = e.layer;
    layer.featureId = L.stamp(layer);
    drawnItems.addLayer(layer);
    editFeatureText(layer);
    showFeatureText(layer);
  });

  // Assuming 'drawnItems' is a L.FeatureGroup containing all layers added to the map
  function searchByText(query) {
    drawnItems.eachLayer(function (layer) {
      if (!query.trim()) {
        // If the query is empty, reset all layers to their default styles
        resetLayerStyle(layer);
      } else {
        // Perform the search and update styles based on the query match
        var isMatch =
          layer.text && layer.text.toLowerCase().includes(query.toLowerCase());
        updateLayerStyle(layer, isMatch);
      }
    });
  }

  function resetLayerStyle(layer) {
    if (layer instanceof L.Marker) {
      // Reset to the default Leaflet marker icon
      layer.setIcon(new L.Icon.Default());
    }
    if (layer instanceof L.Path) {
      // Reset the vector layer style to default
      layer.setStyle({ color: "#3388ff" }); // Leaflet default blue color
    }
  }

  function updateLayerStyle(layer, isMatch) {
    // Change icon or style if there's a search match
    if (layer instanceof L.Marker) {
      layer.setIcon(isMatch ? redIcon : new L.Icon.Default());
    }
    if (layer instanceof L.Path) {
      layer.setStyle({ color: isMatch ? "red" : "#3388ff" });
    }
  }

  document.addEventListener("click", function (event) {
    if (event.target.id === "saveButton") {
      saveFeatureText(event.target.dataset.layerId);
    }
  });

  document
    .getElementById("searchInput")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        searchByText(e.target.value);
      }
    });

  document
    .getElementById("searchButton")
    .addEventListener("click", function () {
      var searchText = document.getElementById("searchInput").value;
      searchByText(searchText);
    });
})();
