import os
import re

pages_dir = r"d:\DARSHAK\IBM\PROJECT\jalrakshak-ai\frontend\src\pages"

# Dictionary of English -> Gujarati for common text in these files
translations = {
    "Water-efficient crop recommendations for Saurashtra": "સૌરાષ્ટ્ર માટે જળ-કાર્યક્ષમ પાક ભલામણો",
    "Groundwater depth monitoring and trend analysis": "ભૂગર્ભ જળ ઊંડાઈ મોનિટરિંગ અને વલણ વિશ્લેષણ",
    "Saurashtra Water Health Map — all 10 districts": "સૌરાષ્ટ્ર જળ સ્વાસ્થ્ય નકશો — તમામ ૧૦ જિલ્લા",
    "Synthetic demonstration coordinates": "સિન્થેટિક નિદર્શન કોઓર્ડિનેટ્સ",
    "Water intelligence overview for Saurashtra": "સૌરાષ્ટ્ર માટે જળ ગુપ્તચર ઝાંખી",
    "Loading water data...": "જળ ડેટા લોડ થઈ રહ્યો છે...",
    "Loading groundwater data...": "ભૂગર્ભ જળ ડેટા લોડ થઈ રહ્યો છે...",
    "Analyzing crop recommendations...": "પાક ભલામણોનું વિશ્લેષણ થઈ રહ્યું છે...",
    "Recommended Actions": "ભલામણ કરેલ ક્રિયાઓ",
    "Recommended Crops for": "માટે ભલામણ કરેલ પાકો",
    "Groundwater Depth Trend (m)": "ભૂગર્ભ જળ ઊંડાઈ વલણ (m)",
    "Drought Risk Factors": "દુષ્કાળ જોખમ પરિબળો",
    "Water Saving Practices": "જળ બચાવવાની પદ્ધતિઓ",
    "Evidence & Analysis": "પુરાવા અને વિશ્લેષણ",
    "Current Depth": "વર્તમાન ઊંડાઈ",
    "Trend": "વલણ",
    "Annual Change": "વાર્ષિક ફેરફાર",
    "5yr Depletion": "૫ વર્ષનો ઘટાડો",
    "Below ground surface": "જમીનની સપાટી નીચે",
    "Long-term direction": "લાંબા ગાળાની દિશા",
    "vs last year": "ગયા વર્ષની સરખામણીમાં",
    "Since 2019 baseline": "૨૦૧૯ બેઝલાઇનથી"
}

def wrap_translation(match):
    text = match.group(1)
    if text in translations:
        gujarati = translations[text]
        return f"{{lang === 'gu' ? '{gujarati}' : '{text}'}}"
    return match.group(0)

def wrap_translation_quotes(match):
    text = match.group(1)
    if text in translations:
        gujarati = translations[text]
        return f"{{lang === 'gu' ? '{gujarati}' : '{text}'}}"
    return match.group(0)

for filename in ["Dashboard.tsx", "HydroAtlas.tsx", "GroundwaterExplorer.tsx", "CropAdvisor.tsx"]:
    filepath = os.path.join(pages_dir, filename)
    if not os.path.exists(filepath): continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Replace raw text nodes like >Text<
    for eng, guj in translations.items():
        # HTML text nodes
        content = content.replace(f">{eng}<", f">{{lang === 'gu' ? '{guj}' : '{eng}'}}<")
        # Strings in quotes (e.g. placeholders or labels in charts)
        # Assuming not matching inside imports
        content = content.replace(f"'{eng}'", f"lang === 'gu' ? '{guj}' : '{eng}'")
        content = content.replace(f'"{eng}"', f"lang === 'gu' ? '{guj}' : '{eng}'")
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Translated {filename}")

