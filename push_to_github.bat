@echo off
echo Starting git initialization > push_log.txt
git init >> push_log.txt 2>&1
echo Adding files >> push_log.txt
git add . >> push_log.txt 2>&1
echo Committing >> push_log.txt
git commit -m "Initial commit: Kombee Fullstack Observability Hackathon" >> push_log.txt 2>&1
echo Setting branch >> push_log.txt
git branch -M main >> push_log.txt 2>&1
echo Adding remote >> push_log.txt
git remote add origin https://github.com/DevamVankhede-Kombee/kombee-fullstack-observability.git >> push_log.txt 2>&1
echo Pushing... >> push_log.txt
git push -u origin main >> push_log.txt 2>&1
echo Done >> push_log.txt
