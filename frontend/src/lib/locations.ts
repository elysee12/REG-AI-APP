export const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Kigali
  'Nyarugenge': { lat: -1.9441, lng: 30.0619 },
  'Gasabo': { lat: -1.9167, lng: 30.0833 },
  'Kicukiro': { lat: -1.9833, lng: 30.1167 },
  'Kigali': { lat: -1.9441, lng: 30.0619 },

  // Southern Province
  'Huye': { lat: -2.5967, lng: 29.7392 },
  'Nyanza': { lat: -2.3500, lng: 29.7500 },
  'Gisagara': { lat: -2.6167, lng: 29.8500 },
  'Nyaruguru': { lat: -2.7167, lng: 29.5167 },
  'Nyamagabe': { lat: -2.4833, lng: 29.4667 },
  'Ruhango': { lat: -2.2333, lng: 29.7833 },
  'Muhanga': { lat: -2.0833, lng: 29.7500 },
  'Kamonyi': { lat: -1.9833, lng: 29.9167 },

  // Western Province
  'Karongi': { lat: -2.1500, lng: 29.3333 },
  'Rutsiro': { lat: -1.9333, lng: 29.3167 },
  'Rubavu': { lat: -1.6833, lng: 29.3333 },
  'Nyabihu': { lat: -1.6500, lng: 29.5000 },
  'Ngororero': { lat: -1.9500, lng: 29.6167 },
  'Rusizi': { lat: -2.4833, lng: 28.9167 },
  'Nyamasheke': { lat: -2.3646, lng: 29.1437 },

  // Northern Province
  'Rulindo': { lat: -1.7333, lng: 29.9333 },
  'Gakenke': { lat: -1.7000, lng: 29.7833 },
  'Musanze': { lat: -1.5000, lng: 29.6333 },
  'Burera': { lat: -1.4500, lng: 29.8500 },
  'Gicumbi': { lat: -1.6000, lng: 30.0500 },

  // Eastern Province
  'Rwamagana': { lat: -1.9500, lng: 30.4333 },
  'Nyagatare': { lat: -1.3000, lng: 30.4000 },
  'Gatsibo': { lat: -1.5833, lng: 30.4500 },
  'Kayonza': { lat: -1.8500, lng: 30.5833 },
  'Kirehe': { lat: -2.2667, lng: 30.6500 },
  'Ngoma': { lat: -2.1833, lng: 30.4667 },
  'Bugesera': { lat: -2.2167, lng: 30.1500 },
};

export const getDistrictCenter = (districtName?: string) => {
  if (!districtName) return null;
  
  // Try exact match
  if (DISTRICT_COORDINATES[districtName]) {
    return DISTRICT_COORDINATES[districtName];
  }
  
  // Try partial match
  const key = Object.keys(DISTRICT_COORDINATES).find(k => 
    districtName.toLowerCase().includes(k.toLowerCase())
  );
  
  return key ? DISTRICT_COORDINATES[key] : null;
};
