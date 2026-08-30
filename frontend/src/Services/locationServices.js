// locationServices.js

/**
 * Connects to the US Census Geocoder API to retrieve a Census Tract GEOID 
 * from latitude and longitude coordinates.
 * 
 * @param {number} lng - Longitude
 * @param {number} lat - Latitude
 * @returns {Promise<string|null>} - Returns the GEOID string, or null if not found.
 */
export async function fetchCensusGeoid(lng, lat) {
  try {
    const url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&layers=10&format=json`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Census API Error: ${response.status}`);
    
    const data = await response.json();
    const tracts = data?.result?.geographies?.["Census Tracts"];
    
    if (tracts && tracts.length > 0) {
      return tracts[0].GEOID;
    }
    return null;
  } catch (error) {
    console.error("Error fetching GEOID:", error);
    return null;
  }
}

/**
 * Standardizes the location payload to match the new backend schema requirements.
 * 
 * @param {Object} googlePlace - The place object returned by Google Places Autocomplete API
 * @returns {Promise<Object>} - The standardized location object
 */
export async function processGooglePlaceSelection(googlePlace) {
  if (!googlePlace || !googlePlace.geometry || !googlePlace.address_components) {
    throw new Error("Invalid Google Place object. Ensure full address is selected.");
  }

  const lat = googlePlace.geometry.location.lat();
  const lng = googlePlace.geometry.location.lng();
  
  let city = "";
  let state = "";
  let zipCode = "";
  let neighborhoodDisplayName = "";

  googlePlace.address_components.forEach(component => {
    const types = component.types;
    if (types.includes("locality")) {
      city = component.long_name;
    }
    if (types.includes("administrative_area_level_1")) {
      state = component.short_name;
    }
    if (types.includes("postal_code")) {
      zipCode = component.long_name;
    }
    if (types.includes("neighborhood")) {
      neighborhoodDisplayName = component.long_name;
    }
  });

  // Fallback for city if locality isn't available
  if (!city) {
    const sublocality = googlePlace.address_components.find(c => c.types.includes("sublocality"));
    if (sublocality) city = sublocality.long_name;
  }
  
  // Fallback for neighborhood if not strictly defined by Google
  if (!neighborhoodDisplayName) {
     neighborhoodDisplayName = city; 
  }

  // Fetch GEOID from Census API
  const tract_geoid = await fetchCensusGeoid(lng, lat);

  return {
    fullAddress: googlePlace.formatted_address,
    city,
    state,
    zipCode,
    neighborhoodDisplayName,
    tract_geoid,
    coordinates: [lng, lat]
  };
}
