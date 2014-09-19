REEL_ID=$(curl -s -X POST -d '{ "commands": [ "git clone --branch=master https://github.com/fishin/reel .", "npm install", "bin/test.sh", [ "uptime", "npm list", "ls -altr" ], "date" ] }' -H "content-type: application/json"  http://localhost:8080/api/reel | awk -F'"' '{print $38}')
#REEL_ID=$(curl -s -X POST -d '{ "commands": [ "git clone --branch=master https://github.com/fishin/reel .", "npm install", "bin/test.sh", "date" ] }' -H "content-type: application/json"  http://localhost:8080/api/reel | awk -F'"' '{print $26}')
echo "REEL: ${REEL_ID}"
THE_PID=$(curl -s "http://localhost:8080/api/reel/${REEL_ID}/run")
echo "PID: ${THE_PID}"
