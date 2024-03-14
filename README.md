Stock prices prediction app



setup:
git clone https://github.com/onidemon/price-prediction.git
cd price-prediction
npm install
npm start


API endpoints: 

http://localhost:3000/api/data-points: returns 10 consecutive data points starting from a random
timestamp. 

http://localhost:3000/api/data-prediction: gets the output from api/data-points and predicts the next 3 values in the timeseries data

Example usage with processing of up to 2 sample files:
curl -X POST http://localhost:3000/api/data-prediction -d '{"input_values": 2}' -H "Content-Type: application/json"

