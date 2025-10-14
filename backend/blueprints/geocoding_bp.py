"""
Geocoding Blueprint - Address and GPS Coordinate Conversion API
Provides address-to-coordinates, coordinates-to-address, ZIP-to-coordinates services
"""

from flask import Blueprint, request, jsonify
import sys
import os

# Add parent directory to path for importing services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.geocoding_service import geocoding_service

# Create the geocoding blueprint
geocoding_bp = Blueprint('geocoding', __name__)


@geocoding_bp.route('/address-to-coordinates', methods=['POST', 'GET'])
def address_to_coordinates():
    """
    Convert address to GPS coordinates
    
    Request methods:
    - POST: JSON body { "address": "123 Main St, Chicago, IL 60601" }
    - GET: Query param ?address=123 Main St, Chicago, IL 60601
    
    Returns:
    {
        "success": true,
        "coordinates": {
            "latitude": 41.8781,
            "longitude": -87.6298
        },
        "address": "123 Main St, Chicago, IL 60601"
    }
    """
    try:
        # Support both POST and GET methods
        if request.method == 'POST':
            data = request.get_json()
            address = data.get('address', '').strip()
        else:  # GET
            address = request.args.get('address', '').strip()
        
        if not address:
            return jsonify({
                'success': False,
                'error': 'Address is required',
                'message': 'Please provide an address to geocode'
            }), 400
        
        # Call geocoding service
        coords = geocoding_service.geocode_address(address)
        
        if coords:
            return jsonify({
                'success': True,
                'coordinates': {
                    'latitude': coords[0],
                    'longitude': coords[1]
                },
                'address': address
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Geocoding failed',
                'message': f'Could not find coordinates for address: {address}'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to geocode address'
        }), 500


@geocoding_bp.route('/zip-to-coordinates', methods=['POST', 'GET'])
def zip_to_coordinates():
    """
    Convert ZIP code to GPS coordinates
    
    Request methods:
    - POST: JSON body { "zip_code": "60601" }
    - GET: Query param ?zip_code=60601
    
    Returns:
    {
        "success": true,
        "coordinates": {
            "latitude": 41.8781,
            "longitude": -87.6298
        },
        "zip_code": "60601"
    }
    """
    try:
        # Support both POST and GET methods
        if request.method == 'POST':
            data = request.get_json()
            zip_code = data.get('zip_code', '').strip()
        else:  # GET
            zip_code = request.args.get('zip_code', '').strip()
        
        if not zip_code:
            return jsonify({
                'success': False,
                'error': 'ZIP code is required',
                'message': 'Please provide a ZIP code'
            }), 400
        
        # Call geocoding service
        coords = geocoding_service.get_zip_coordinates(zip_code)
        
        return jsonify({
            'success': True,
            'coordinates': {
                'latitude': coords[0],
                'longitude': coords[1]
            },
            'zip_code': zip_code
        }), 200
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to get coordinates for ZIP code'
        }), 500


@geocoding_bp.route('/city-to-coordinates', methods=['POST', 'GET'])
def city_to_coordinates():
    """
    Convert city name to GPS coordinates
    
    Request methods:
    - POST: JSON body { "city": "Chicago", "state": "IL" }
    - GET: Query params ?city=Chicago&state=IL
    
    Returns:
    {
        "success": true,
        "coordinates": {
            "latitude": 41.8781,
            "longitude": -87.6298
        },
        "city": "Chicago",
        "state": "IL"
    }
    """
    try:
        # Support both POST and GET methods
        if request.method == 'POST':
            data = request.get_json()
            city = data.get('city', '').strip()
            state = data.get('state', '').strip()
        else:  # GET
            city = request.args.get('city', '').strip()
            state = request.args.get('state', '').strip()
        
        if not city:
            return jsonify({
                'success': False,
                'error': 'City is required',
                'message': 'Please provide a city name'
            }), 400
        
        # Call geocoding service
        coords = geocoding_service.get_city_coordinates(city, state)
        
        if coords:
            return jsonify({
                'success': True,
                'coordinates': {
                    'latitude': coords[0],
                    'longitude': coords[1]
                },
                'city': city,
                'state': state or None
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Geocoding failed',
                'message': f'Could not find coordinates for city: {city}, {state}'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to geocode city'
        }), 500


@geocoding_bp.route('/coordinates-to-address', methods=['POST', 'GET'])
def coordinates_to_address():
    """
    Convert GPS coordinates to address (reverse geocoding)
    
    Request methods:
    - POST: JSON body { "latitude": 41.8781, "longitude": -87.6298 }
    - GET: Query params ?latitude=41.8781&longitude=-87.6298
    
    Returns:
    {
        "success": true,
        "address": {
            "city": "Chicago",
            "state": "Illinois",
            "zip_code": "60601",
            "country": "United States",
            "formatted_address": "123 Main St, Chicago, IL 60601, USA"
        },
        "coordinates": {
            "latitude": 41.8781,
            "longitude": -87.6298
        }
    }
    """
    try:
        # Support both POST and GET methods
        if request.method == 'POST':
            data = request.get_json()
            latitude = data.get('latitude')
            longitude = data.get('longitude')
        else:  # GET
            latitude = request.args.get('latitude', type=float)
            longitude = request.args.get('longitude', type=float)
        
        if latitude is None or longitude is None:
            return jsonify({
                'success': False,
                'error': 'Coordinates are required',
                'message': 'Please provide both latitude and longitude'
            }), 400
        
        # Validate coordinate range
        if not geocoding_service.validate_coordinates(latitude, longitude):
            return jsonify({
                'success': False,
                'error': 'Invalid coordinates',
                'message': 'Coordinates must be within US bounds'
            }), 400
        
        # Call geocoding service for reverse geocoding
        address_info = geocoding_service.reverse_geocode(latitude, longitude)
        
        if address_info:
            return jsonify({
                'success': True,
                'address': address_info,
                'coordinates': {
                    'latitude': latitude,
                    'longitude': longitude
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Reverse geocoding failed',
                'message': f'Could not find address for coordinates: ({latitude}, {longitude})'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to reverse geocode coordinates'
        }), 500


@geocoding_bp.route('/validate-coordinates', methods=['POST', 'GET'])
def validate_coordinates():
    """
    Validate if GPS coordinates are within US bounds
    
    Request methods:
    - POST: JSON body { "latitude": 41.8781, "longitude": -87.6298 }
    - GET: Query params ?latitude=41.8781&longitude=-87.6298
    
    Returns:
    {
        "success": true,
        "valid": true,
        "coordinates": {
            "latitude": 41.8781,
            "longitude": -87.6298
        }
    }
    """
    try:
        # Support both POST and GET methods
        if request.method == 'POST':
            data = request.get_json()
            latitude = data.get('latitude')
            longitude = data.get('longitude')
        else:  # GET
            latitude = request.args.get('latitude', type=float)
            longitude = request.args.get('longitude', type=float)
        
        if latitude is None or longitude is None:
            return jsonify({
                'success': False,
                'error': 'Coordinates are required',
                'message': 'Please provide both latitude and longitude'
            }), 400
        
        # Validate coordinates
        is_valid = geocoding_service.validate_coordinates(latitude, longitude)
        
        return jsonify({
            'success': True,
            'valid': is_valid,
            'coordinates': {
                'latitude': latitude,
                'longitude': longitude
            },
            'message': 'Coordinates are valid for US locations' if is_valid else 'Coordinates are outside US bounds'
        }), 200
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to validate coordinates'
        }), 500
