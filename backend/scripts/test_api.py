import urllib.request
import json

for days in [7, 14, 30, 90]:
    url = f"http://localhost:8000/api/dashboard/stats?days={days}"
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read())
        print(f"{days} days: {len(data['dailyWorkOrders'])} data points")
