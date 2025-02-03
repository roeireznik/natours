/* eslint-disabled */

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoicm9laXJlem5payIsImEiOiJjbTZkOHhnZGMwNDdoMmlyMHZzcnVkejRtIn0._M95bDEpBDqx-6pr7WWBsA';

  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/roeireznik/cm6d9ul30004i01sgh7hx7uiw',
    scrollZoom: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    // center: [-118.113491, 34.111745],
    // zoom: 10,
    // interactive: false,
    projection: 'mercator',
  });

  const bounds = new mapboxgl.LngLatBounds();
  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
