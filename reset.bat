@echo off
REM Remove the build directory
rmdir /s /q build

REM Run the build process
npm run build

REM Serve the build directory
npx serve -s build
