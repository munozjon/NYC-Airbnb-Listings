# Import dependencies
from pymongo import MongoClient
import pandas as pd
from json import loads, dumps
from flask import Flask, jsonify
from flask_cors import CORS

# Establish connection to database
mongo = MongoClient(port=27017)

# Convert collection to a DataFrame
listings = mongo['listings_db'].nyc_listings
listings_arr = listings.find()
listings_df = pd.DataFrame(listings_arr)

# Clean the DataFrame, select only necessary columns
reduced_listings = listings_df[['name', 'neighbourhood_cleansed', 'neighbourhood_group_cleansed'\
                               ,'latitude','longitude','room_type', 'amenities', 'price'\
                                , 'number_of_reviews', 'review_scores_rating']]
reduced_listings['price'] = reduced_listings['price'].str.replace(",", "")
reduced_listings['price'] = reduced_listings['price'].str.replace("$", "")

reduced_listings = reduced_listings.astype({"price": float})

# Convert to a JSON object
results_cleaned_df = reduced_listings.to_json(orient='records')

# Create aggregate functions

# Average price by neighbourhood > room type
def nbhd_price_avg(df):
    avg_price = df.groupby(['neighbourhood_group_cleansed', "neighbourhood_cleansed", 'room_type'])["price"].mean()
    avg_price_boro = avg_price.round(2).reset_index() 
    return avg_price_boro

# Number of rooms by neighbourhood > room type
def nbhd_room_type_count(df):
    roomtype_grouped = df.groupby(['neighbourhood_group_cleansed','neighbourhood_cleansed', 'room_type']).size().reset_index(name='room_count')
    return roomtype_grouped

# Join aggregate DataFrames
combined_df = nbhd_price_avg(reduced_listings).merge(nbhd_room_type_count(reduced_listings), how='inner', on=['neighbourhood_group_cleansed','neighbourhood_cleansed', 'room_type'])
combined_df = combined_df.rename(columns={'neighbourhood_group_cleansed': 'Borough', 'neighbourhood_cleansed': 'Neighbourhood', 'room_type': "Room Type", 'price': "Average Price", 'room_count': 'Room Count'})

# Convert to JSON object
results_agg_df = combined_df.to_json(orient="records")



# Establish Flask connection
app = Flask(__name__)
CORS(app)

# Set endpoint for the cleaned DataFrame JSON object
@app.route('/main', methods=['GET'])
def get_cleaned_df():
    return jsonify(results_cleaned_df)

# Set endpoint for JSON of aggregate DataFrame object
@app.route('/aggregates', methods=['GET'])
def get_aggregates():
    return jsonify(results_agg_df)

if __name__ == '__main__':
    app.run(debug=True)