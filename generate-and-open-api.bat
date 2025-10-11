@echo off
chcp 65001 > nul
echo Generating TCC Parking System API documentation...

REM Generate API documentation
node generate-api-docs.js

echo.
echo API documentation generation complete!
echo.
echo Opening API import guide...

REM Open import guide page
start api-import-guide.html

echo.
echo Please follow the guide to import API documentation into Apifox.
echo.
pause