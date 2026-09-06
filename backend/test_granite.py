import sys, os
os.chdir('d:/DARSHAK/IBM/PROJECT/jalrakshak-ai/backend')
sys.path.insert(0, '.')
from app.services.granite_service import generate_response, chat

print("Testing IBM Granite ibm/granite-4-h-small...")
result = generate_response("In one sentence, what is the main cause of groundwater depletion in Saurashtra?")
print(f"Demo mode: {result['demo_mode']}")
print(f"Error: {result['error']}")
print(f"Response: {result['text'][:200]}")
