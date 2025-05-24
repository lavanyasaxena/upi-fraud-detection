#Run this before flask
# python train_model.py

#Backend setup
# pip install flask flask-cors scikit-learn joblib numpy
# python app.py



from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)

# Load dummy model
model = joblib.load('model.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    amount = float(data['amount'])
    time = float(data['time'])
    features = np.array([[amount, time]])
    prediction = model.predict(features)[0]
    result = 'Fraudulent' if prediction == 1 else 'Legitimate'
    return jsonify({'result': result})

if __name__ == '__main__':
    app.run(debug=True)
