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

# Number of selected amenities per neighbourhood: 
keywords = ["Wifi", "Kitchen", "Air conditioning", "Backyard", "Pets allowed", "Washer", "Dryer", "Dedicated workspace"]

def amenities_by_nbhd(df, keywords):

    # Explode the amenities column:
    
    listings_exploded = reduced_listings.explode('amenities').copy()
    
    # Count the occurrences of each keyword in the amenities column by neighborhood

    listings_exploded["amenities"] = listings_exploded["amenities"].apply(lambda x : x.lower() if type(x)==str else x) 
    keywords = [x.lower() for x in keywords]
    listings_exploded = listings_exploded[listings_exploded["amenities"].isin(keywords)].reset_index(drop=1)
    listings_exploded = listings_exploded.groupby(["neighbourhood_cleansed", "neighbourhood_group_cleansed", "amenities"]).size().reset_index(name='count')
    listings_exploded = listings_exploded.rename(columns={'neighbourhood_group_cleansed':'Borough', 'neighbourhood_cleansed':'Neighbourhood'})
    return listings_exploded

amenities_per_nbhd = amenities_by_nbhd(reduced_listings,keywords)

#Convert to json object:
amenities_nbhd = amenities_per_nbhd.to_json(orient="records")

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

# Set endpoint for JSON of aggregate Ameninities object:
@app.route('/amenities', methods=['GET'])
def get_amenities(): 
    return jsonify(amenities_nbhd)

if __name__ == '__main__':
    app.run(debug=True)