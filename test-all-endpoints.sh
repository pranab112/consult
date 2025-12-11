#!/bin/bash

URL="https://studyabroad-fullstack-production.up.railway.app"
EMAIL="test$(date +%s)@example.com"
PASSWORD="Test123"

echo "======================================="
echo "🧪 Comprehensive API Testing"
echo "======================================="
echo ""

# 1. Health Check
echo "1️⃣ Health Check:"
HEALTH=$(curl -s "$URL/health")
if echo "$HEALTH" | grep -q "healthy"; then
    echo "   ✅ Health endpoint working"
else
    echo "   ❌ Health endpoint failed"
fi

# 2. Register new user
echo ""
echo "2️⃣ User Registration:"
REGISTER=$(curl -s -X POST "$URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"Test User\",\"agencyName\":\"Test Agency\"}")

if echo "$REGISTER" | grep -q "token"; then
    echo "   ✅ Registration successful"
    TOKEN=$(echo "$REGISTER" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)
    USER_ID=$(echo "$REGISTER" | python3 -c "import sys, json; print(json.load(sys.stdin)['user']['id'])" 2>/dev/null)
    AGENCY_ID=$(echo "$REGISTER" | python3 -c "import sys, json; print(json.load(sys.stdin)['user']['agencyId'])" 2>/dev/null)
    echo "   ✅ Token received"
    echo "   ✅ User ID: ${USER_ID:0:8}..."
else
    echo "   ❌ Registration failed"
    echo "   Response: $REGISTER"
fi

# 3. Login test
echo ""
echo "3️⃣ User Login:"
LOGIN=$(curl -s -X POST "$URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

if echo "$LOGIN" | grep -q "token"; then
    echo "   ✅ Login successful"
    TOKEN=$(echo "$LOGIN" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)
else
    echo "   ❌ Login failed"
fi

# 4. Get user profile
echo ""
echo "4️⃣ User Profile:"
PROFILE=$(curl -s "$URL/api/users/profile" \
    -H "Authorization: Bearer $TOKEN")

if echo "$PROFILE" | grep -q "email"; then
    echo "   ✅ Profile retrieval successful"
else
    echo "   ❌ Profile retrieval failed"
fi

# 5. Create a student
echo ""
echo "5️⃣ Student Creation:"
STUDENT=$(curl -s -X POST "$URL/api/students" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "address": "123 Test St",
        "dateOfBirth": "2000-01-01",
        "passportNumber": "A12345678",
        "desiredCountry": "Australia",
        "desiredCourse": "Computer Science",
        "status": "Active"
    }')

if echo "$STUDENT" | grep -q "id"; then
    echo "   ✅ Student created successfully"
    STUDENT_ID=$(echo "$STUDENT" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
    echo "   ✅ Student ID: ${STUDENT_ID:0:8}..."
else
    echo "   ❌ Student creation failed"
fi

# 6. Get all students
echo ""
echo "6️⃣ List Students:"
STUDENTS=$(curl -s "$URL/api/students" \
    -H "Authorization: Bearer $TOKEN")

if echo "$STUDENTS" | grep -q "\\["; then
    COUNT=$(echo "$STUDENTS" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)
    echo "   ✅ Students retrieved: $COUNT total"
else
    echo "   ❌ Students retrieval failed"
fi

echo ""
echo "======================================="
echo "📊 API Test Summary"
echo "======================================="