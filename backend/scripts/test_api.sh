#!/bin/bash
# Sageo API Test Script - IdentityLogic Endpoints

BASE_URL="${1:-http://localhost:3001}"

echo "=== Sageo API Tests ==="
echo "Base URL: $BASE_URL"
echo ""

# Test 1: GET /agents (list all)
echo "1. GET /agents"
curl -s "$BASE_URL/agents" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'   Found {len(d)} agents')"

# Test 2: GET /agents with status filter
echo "2. GET /agents?status=ACTIVE"
curl -s "$BASE_URL/agents?status=ACTIVE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'   Found {len(d)} active agents')"

# Test 3: GET /agents with streaming filter
echo "3. GET /agents?streaming=true"
curl -s "$BASE_URL/agents?streaming=true" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'   Found {len(d)} agents with streaming')"

# Test 4: GET /agents with tags filter
echo "4. GET /agents?tags=weather"
curl -s "$BASE_URL/agents?tags=weather" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'   Found {len(d)} agents with weather tag')"

# Test 5: GET /agents with pagination
echo "5. GET /agents?limit=2&offset=0"
curl -s "$BASE_URL/agents?limit=2&offset=0" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'   Got {len(d)} agents (page 1)')"

# Test 6: GET /agents/search
echo "6. GET /agents/search?q=weather"
curl -s "$BASE_URL/agents/search?q=weather" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'   Found {len(d)} matches for \"weather\"')"

# Test 7: GET /agents/search (stock)
echo "7. GET /agents/search?q=stock"
curl -s "$BASE_URL/agents/search?q=stock" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'   Found {len(d)} matches for \"stock\"')"

# Test 8: GET /agents/by-skill
echo "8. GET /agents/by-skill/weather_forecast"
curl -s "$BASE_URL/agents/by-skill/weather_forecast" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'   Found {len(d)} agents with skill')"

# Test 9: GET /agents/by-url (existing)
echo "9. GET /agents/by-url?url=https://weather.example.com"
curl -s "$BASE_URL/agents/by-url?url=https://weather.example.com" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'   Result: {d.get(\"agent_card\",{}).get(\"name\",\"null\") if d else \"null\"}')"

# Test 10: GET /agents/by-url (non-existent)
echo "10. GET /agents/by-url?url=https://nonexistent.example.com"
curl -s "$BASE_URL/agents/by-url?url=https://nonexistent.example.com" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'   Result: {\"null\" if d is None else \"found\"}')"

# Test 11: GET /agents/:sageo_id/card (existing endpoint)
echo "11. GET /agents/agent_1/card"
curl -s "$BASE_URL/agents/agent_1/card" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'   Agent: {d.get(\"name\",\"?\")}, Skills: {len(d.get(\"skills\",[]))}')"

echo ""
echo "=== Interaction API Tests ==="
# Test 12: GET /interactions/recent
echo "12. GET /interactions/recent?limit=5"
curl -s "$BASE_URL/interactions/recent?limit=5" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'   Recent Interactions: {len(d.get(\"interactions\",[]))}')"

# Test 13: GET /interactions/:id (first interaction for agent_1)
echo "13. GET /interactions/:id (agent_1)"
INTERACTION_ID=$(curl -s "$BASE_URL/agents/agent_1/interactions?limit=1&offset=0" | python3 -c "import sys,json; d=json.load(sys.stdin); interactions=d.get('interactions',[]); print(interactions[0].get('interaction_id','') if interactions else '')")
if [ -z "$INTERACTION_ID" ]; then
  echo "   Interaction: none"
else
  curl -s "$BASE_URL/interactions/$INTERACTION_ID?sageo_id=agent_1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'   Interaction: {d.get(\"interaction_id\",\"?\")} ({d.get(\"intent\",\"?\")})')"
fi

# Test 14: GET /agents/:id/interactions
echo "14. GET /agents/agent_1/interactions"
curl -s "$BASE_URL/agents/agent_1/interactions" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'   Agent Interactions: {len(d.get(\"interactions\",[]))}')"

# Test 15: GET /agents/:id/stats
echo "15. GET /agents/agent_1/stats"
curl -s "$BASE_URL/agents/agent_1/stats" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'   Stats: Sent={d.get(\"stats\",{}).get(\"total_requests_sent\",\"?\")}')"

echo ""
echo "=== Tests Complete ==="
