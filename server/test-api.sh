#!/bin/bash
# Enable trace
set -e

echo "Logging in..."
LOGIN_RESP=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"krishnashinde9898@gmail.com", "password":"Password123"}')

TOKEN=$(echo $LOGIN_RESP | grep -oP '"token":"\K[^"]+')
if [ -z "$TOKEN" ]; then
    echo "Failed to get token"
    echo $LOGIN_RESP
    exit 1
fi
echo "Got token."

echo "Getting candidates list..."
CANDS=$(curl -s -X GET http://localhost:5000/api/recruiter/candidates \
  -H "Authorization: Bearer $TOKEN")

CAND_ID=$(echo $CANDS | grep -oP '"id":"\K[^"]+' | head -1)
if [ -z "$CAND_ID" ]; then
    echo "No candidates found"
    exit 1
fi
echo "Testing shortlist for candidate $CAND_ID..."

curl -s -X POST http://localhost:5000/api/recruiter/shortlist \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"candidateId":"'"$CAND_ID"'"}' | jq .

echo -e "\nTesting create room..."
curl -s -X POST http://localhost:5000/api/room \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Room", "candidateIds":["'"$CAND_ID"'"]}' | jq .

