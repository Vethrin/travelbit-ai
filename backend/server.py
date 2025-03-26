import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
from dotenv import load_dotenv
from datetime import datetime, timedelta
import requests
import json
from flask_sqlalchemy import SQLAlchemy

load_dotenv()

app = Flask(__name__)
CORS(app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/travelbit')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# OpenAI configuration
openai.api_key = os.getenv('OPENAI_API_KEY')

# Database Models
class Itinerary(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_request = db.Column(db.String(500), nullable=False)
    destination = db.Column(db.String(100), nullable=False)
    travel_dates = db.Column(db.String(100), nullable=False)
    traveler_count = db.Column(db.Integer, nullable=False)
    budget = db.Column(db.String(50), nullable=False)
    generated_itinerary = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Itinerary {self.destination}>'

# Helper Functions
def get_flight_prices(origin, destination, departure_date, return_date):
    # In a real app, you'd use an API like Skyscanner or Amadeus
    # This is a mock implementation
    base_price = 300
    variation = (hash(origin + destination + departure_date) % 200) - 100
    return base_price + variation

def get_hotel_prices(destination, check_in, check_out):
    # Mock implementation - real app would use hotel API
    base_price = 150
    variation = (hash(destination + check_in + check_out) % 100) - 50
    return base_price + variation

def generate_itinerary_with_ai(prompt):
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a expert travel planner. Create detailed itineraries including flights, hotels, activities, and costs. Provide realistic estimates and practical advice."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1500
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error generating itinerary: {e}")
        return None

# Routes
@app.route('/generate-itinerary', methods=['POST'])
def generate_itinerary():
    data = request.json
    required_fields = ['destination', 'start_date', 'end_date', 'travelers', 'budget', 'interests']
    
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Create prompt for AI
    prompt = f"""Create a detailed travel itinerary with the following details:
    - Destination: {data['destination']}
    - Travel Dates: {data['start_date']} to {data['end_date']}
    - Number of Travelers: {data['travelers']}
    - Budget: {data['budget']}
    - Interests: {', '.join(data['interests'])}
    
    Include:
    1. Flight options with estimated prices
    2. Hotel recommendations with estimated prices
    3. Daily activity schedule
    4. Estimated total cost
    5. Travel tips and recommendations
    
    Make the itinerary detailed and practical."""
    
    # Generate itinerary with AI
    itinerary_text = generate_itinerary_with_ai(prompt)
    
    if not itinerary_text:
        return jsonify({"error": "Failed to generate itinerary"}), 500
    
    # Save to database
    new_itinerary = Itinerary(
        user_request=prompt,
        destination=data['destination'],
        travel_dates=f"{data['start_date']} to {data['end_date']}",
        traveler_count=data['travelers'],
        budget=data['budget'],
        generated_itinerary=itinerary_text
    )
    
    try:
        db.session.add(new_itinerary)
        db.session.commit()
    except Exception as e:
        print(f"Error saving itinerary: {e}")
        db.session.rollback()
    
    return jsonify({
        "itinerary": itinerary_text,
        "id": new_itinerary.id
    })

@app.route('/get-itinerary/<int:id>', methods=['GET'])
def get_itinerary(id):
    itinerary = Itinerary.query.get(id)
    if not itinerary:
        return jsonify({"error": "Itinerary not found"}), 404
    
    return jsonify({
        "id": itinerary.id,
        "destination": itinerary.destination,
        "dates": itinerary.travel_dates,
        "travelers": itinerary.traveler_count,
        "budget": itinerary.budget,
        "itinerary": itinerary.generated_itinerary,
        "created_at": itinerary.created_at.isoformat()
    })

@app.route('/get-destination-images', methods=['GET'])
def get_destination_images():
    destination = request.args.get('destination')
    if not destination:
        return jsonify({"error": "Destination parameter is required"}), 400
    
    # In a real app, you'd use an API like Unsplash or Pixabay
    # This is a mock implementation
    mock_images = [
        {"url": f"https://source.unsplash.com/random/800x600/?{destination},travel", "description": f"Beautiful view of {destination}"},
        {"url": f"https://source.unsplash.com/random/800x600/?{destination},city", "description": f"Cityscape of {destination}"},
        {"url": f"https://source.unsplash.com/random/800x600/?{destination},landscape", "description": f"Landscape of {destination}"}
    ]
    
    return jsonify({"images": mock_images})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)