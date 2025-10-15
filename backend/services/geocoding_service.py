"""
Geocoding Service for ChefAsap Backend
Provides improved location services using multiple geocoding providers
"""

import requests
import time
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from typing import Tuple, Optional, Dict
import logging

logger = logging.getLogger(__name__)

class GeocodingService:
    def __init__(self):
        # Initialize Nominatim (free OpenStreetMap geocoder)
        self.nominatim = Nominatim(user_agent="chefasap_v1.0")
        
        # Fallback hardcoded coordinates for major cities/zip codes
        self.fallback_coordinates = {
            # Major US Cities by ZIP
            '60601': (41.8781, -87.6298),  # Chicago, IL
            '10001': (40.7505, -73.9934),  # New York, NY
            '90210': (34.0901, -118.4065), # Beverly Hills, CA
            '94102': (37.7749, -122.4194), # San Francisco, CA
            '90001': (33.9731, -118.2479), # Los Angeles, CA
            '75201': (32.7767, -96.7970),  # Dallas, TX
            '33101': (25.7617, -80.1918),  # Miami, FL
            '98101': (47.6062, -122.3321), # Seattle, WA
            '02101': (42.3601, -71.0589),  # Boston, MA
            '30301': (33.7490, -84.3880),  # Atlanta, GA
            '80201': (39.7392, -104.9903), # Denver, CO
            '19101': (39.9526, -75.1652),  # Philadelphia, PA
            '85001': (33.4484, -112.0740), # Phoenix, AZ
            '20001': (38.9072, -77.0369),  # Washington, DC
            
            # Major ZIP code areas
            '10': (40.7128, -74.0060),     # New York area
            '20': (38.9072, -77.0369),     # Washington DC area
            '30': (33.7490, -84.3880),     # Atlanta area
            '60': (41.8781, -87.6298),     # Chicago area
            '90': (34.0522, -118.2437),    # Los Angeles area
            '94': (37.7749, -122.4194),    # San Francisco area
        }
    
    def geocode_address(self, address: str) -> Optional[Tuple[float, float]]:
        """
        Geocode a full address to latitude/longitude coordinates
        Args:
            address: Full address string (e.g., "123 Main St, Chicago, IL 60601")
        Returns:
            Tuple of (latitude, longitude) or None if geocoding fails
        """
        try:
            # Try Nominatim first (free, no API key required)
            location = self.nominatim.geocode(address, timeout=10)
            if location:
                logger.info(f"Successfully geocoded address: {address} -> ({location.latitude}, {location.longitude})")
                return (location.latitude, location.longitude)
            
            # If Nominatim fails, try to extract zip code for fallback
            zip_code = self._extract_zip_code(address)
            if zip_code:
                coords = self.get_zip_coordinates(zip_code)
                logger.warning(f"Used fallback coordinates for zip {zip_code}: {coords}")
                return coords
            
            logger.warning(f"Could not geocode address: {address}")
            return None
            
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            logger.error(f"Geocoding service error for address '{address}': {e}")
            # Try fallback with zip code
            zip_code = self._extract_zip_code(address)
            if zip_code:
                return self.get_zip_coordinates(zip_code)
            return None
        except Exception as e:
            logger.error(f"Unexpected error geocoding address '{address}': {e}")
            return None
    
    def get_zip_coordinates(self, zip_code: str) -> Tuple[float, float]:
        """
        Get coordinates for a ZIP code using geocoding service with intelligent fallbacks
        Args:
            zip_code: ZIP code string (e.g., "60601" or "60601-1234")
        Returns:
            Tuple of (latitude, longitude)
        """
        # Clean zip code (remove +4 extension)
        clean_zip = zip_code.split('-')[0].strip()
        
        # Try exact match first
        if clean_zip in self.fallback_coordinates:
            return self.fallback_coordinates[clean_zip]
        
        # Try geocoding the zip code
        try:
            location = self.nominatim.geocode(f"{clean_zip}, USA", timeout=10)
            if location:
                coords = (location.latitude, location.longitude)
                logger.info(f"Geocoded ZIP {clean_zip}: {coords}")
                return coords
        except Exception as e:
            logger.warning(f"Could not geocode ZIP {clean_zip}: {e}")
        
        # Try partial ZIP matching for major areas (first 2 digits)
        zip_prefix = clean_zip[:2]
        if zip_prefix in self.fallback_coordinates:
            logger.info(f"Using area coordinates for ZIP prefix {zip_prefix}")
            return self.fallback_coordinates[zip_prefix]
        
        # Final fallback to NYC coordinates
        logger.warning(f"No coordinates found for ZIP {clean_zip}, using NYC as fallback")
        return (40.7128, -74.0060)
    
    def get_city_coordinates(self, city: str, state: str = None) -> Optional[Tuple[float, float]]:
        """
        Get coordinates for a city name
        Args:
            city: City name
            state: State name or abbreviation (optional)
        Returns:
            Tuple of (latitude, longitude) or None
        """
        try:
            query = city
            if state:
                query += f", {state}"
            query += ", USA"
            
            location = self.nominatim.geocode(query, timeout=10)
            if location:
                return (location.latitude, location.longitude)
            
            return None
        except Exception as e:
            logger.error(f"Error geocoding city '{city}, {state}': {e}")
            return None
    
    def reverse_geocode(self, latitude: float, longitude: float) -> Optional[Dict[str, str]]:
        """
        Convert coordinates back to address information
        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
        Returns:
            Dictionary with address components or None
        """
        try:
            location = self.nominatim.reverse(f"{latitude}, {longitude}", timeout=10)
            if location and location.raw:
                address = location.raw.get('address', {})
                return {
                    'city': address.get('city') or address.get('town') or address.get('village'),
                    'state': address.get('state'),
                    'zip_code': address.get('postcode'),
                    'country': address.get('country'),
                    'formatted_address': location.address
                }
            return None
        except Exception as e:
            logger.error(f"Error reverse geocoding ({latitude}, {longitude}): {e}")
            return None
    
    def _extract_zip_code(self, address: str) -> Optional[str]:
        """
        Extract ZIP code from an address string
        Args:
            address: Address string
        Returns:
            ZIP code string or None
        """
        import re
        # Look for 5-digit ZIP codes (with optional +4 extension)
        zip_pattern = r'\b\d{5}(?:-\d{4})?\b'
        match = re.search(zip_pattern, address)
        return match.group(0) if match else None
    
    def validate_coordinates(self, latitude: float, longitude: float) -> bool:
        """
        Validate if coordinates are within reasonable bounds for US locations
        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
        Returns:
            True if coordinates are valid for US, False otherwise
        """
        # US approximate bounds
        return (24.0 <= latitude <= 49.0) and (-125.0 <= longitude <= -66.0)

# Create a global instance for use across the application
geocoding_service = GeocodingService()

def get_coordinates_for_address(address: str) -> Tuple[float, float]:
    """
    Convenience function to get coordinates for any address
    Compatible with existing code that expects a simple function
    """
    coords = geocoding_service.geocode_address(address)
    if coords:
        return coords
    # Fallback to NYC if all else fails
    return (40.7128, -74.0060)

def get_coordinates_for_zip(zip_code: str) -> Tuple[float, float]:
    """
    Convenience function to get coordinates for ZIP code
    Compatible with existing code that expects a simple function
    """
    return geocoding_service.get_zip_coordinates(zip_code)