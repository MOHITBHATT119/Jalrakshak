import sys  
content = open('frontend/src/pages/Dashboard.tsx', 'r', encoding='utf-8').read()  
content = content.replace('Water Health Score', '{t(\'Water Health Score\')}')  
content = content.replace('Drought Risk', '{t(\'Drought Risk\')}')  
