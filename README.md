Stock prices prediction app



setup:
git clone https://github.com/onidemon/price-prediction.git
cd price-prediction
npm install
npm start


API endpoints: 

/api/data-points: returns 10 consecutive data points starting from a random
timestamp. 

/api/data-prediction: gets the output from api/data-points and predicts the next 3 values in the timeseries data

Example usage:

Input parameter: The recommended number of files to be sampled for each Stock Exchange.
Possible input_values are 1 or 2.

curl -X POST http://localhost:3000/api/data-prediction -d '{"input_values": 2}' -H "Content-Type: application/json"

