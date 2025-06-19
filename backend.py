from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import json
import os

app = Flask(__name__, static_folder='.')
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/')
def index():
    return send_from_directory('.', 'chat.html')

@app.route('/<path:path>')
def serve_file(path):
    return send_from_directory('.', path)

@app.route('/api/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message', '')
    print(f"Received message: {user_message}")

    try:
        # Connect to Ollama's API running locally
        response = requests.post(
            'http://localhost:11434/api/chat',
            json={
                "model": "tinyllama",
                "messages": [{"role": "user", "content": user_message}],
                "stream": False
            },
            timeout=30
        )

        if response.status_code != 200:
            print(f"Ollama API error: {response.status_code} - {response.text}")
            raise requests.exceptions.ConnectionError("Ollama not responding")

        # Debug: print the full response
        response_data = response.json()
        print(f"OLLAMA response: {json.dumps(response_data, indent=2)}")

        # Extract the assistant's reply from Ollama response
        if "message" in response_data and "content" in response_data["message"]:
            reply = response_data["message"]["content"]
        else:
            reply = "No response from AI model"

        return jsonify({"reply": reply})

    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to Ollama API. Using fallback response.")
        # Fallback response when Ollama is not available
        import random
        fallback_responses = [
            f"I understand you said: '{user_message}'. I'm currently unable to connect to the AI service, but I'm here to help!",
            f"Thanks for your message: '{user_message}'. The AI service is temporarily unavailable, but I received your input.",
            f"I see you wrote: '{user_message}'. I'm having trouble connecting to the main AI service right now."
        ]
        return jsonify({"reply": random.choice(fallback_responses)})

    except requests.exceptions.Timeout:
        print("ERROR: Ollama API timeout. Using fallback response.")
        return jsonify({"reply": f"I received your message: '{user_message}'. The AI service is taking too long to respond, but I'm here to help!"})

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return jsonify({"reply": f"AI backend error: {str(e)}"})

if __name__ == '__main__':
    print("Starting Flask server on http://localhost:5000")
    print("Make sure Ollama is running with: ollama run tinyllama")
    try:
        app.run(host='0.0.0.0', port=5000, debug=True)
    except Exception as e:
        print(f"Failed to start server: {e}")
