
import requests
import json
import time

def check_transfers():
    # Use the key found in check_bookies.py
    api_key = "5baf95f049ec8c2ebf0a98dcfacee930"
    
    url = "https://v3.football.api-sports.io/transfers"
    # Just checking for a specific team (e.g. Chelsea = 49) or player to see structure
    # Testing if we can filter by league directly (e.g. Premier League = 39)
    querystring = {"league": "39"}

    
    headers = {
        'x-rapidapi-host': "v3.football.api-sports.io",
        'x-rapidapi-key': api_key
    }

    try:
        response = requests.get(url, headers=headers, params=querystring)
        data = response.json()
        
        print(f"Status: {response.status_code}")
        
        if "response" in data:
            print(f"Count: {len(data['response'])}")
            if len(data['response']) > 0:
                print("Sample Entry:")
                print(json.dumps(data['response'][0], indent=2))
        else:
            print("No response field found")
            print(data)

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_transfers()
