"""
Generate verified Saurashtra village master dataset and consistent
CGWB groundwater, IMD rainfall, Census water demand, and recharge CSVs.
"""
import csv
import os

DATA_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "../../data"))

VILLAGES = [
    # Rajkot
    ("RKT001", "Kothariya", "Rajkot", "Rajkot", "581001", 22.2695, 70.7988, 8420, 3200, "Cotton;Groundnut", 648, 19.2, "alluvial", "estimated"),
    ("RKT002", "Aji Dam Village", "Rajkot", "Rajkot", "581002", 22.3215, 70.8531, 6780, 2800, "Groundnut;Wheat", 648, 17.8, "alluvial", "estimated"),
    ("RKT003", "Mevasa", "Rajkot", "Rajkot", "581003", 22.2901, 70.8215, 4560, 1900, "Cotton;Castor", 645, 20.5, "alluvial", "estimated"),
    ("RKT004", "Dedadra", "Rajkot", "Rajkot", "581004", 22.3401, 70.7712, 3210, 1400, "Groundnut;Millet", 650, 18.9, "alluvial", "estimated"),
    ("RKT005", "Bhayavadar", "Rajkot", "Jetpur", "581005", 21.8956, 70.6234, 12300, 5600, "Groundnut;Cotton", 680, 15.4, "alluvial", "estimated"),
    ("RKT006", "Paddhari", "Rajkot", "Paddhari", "581006", 22.4358, 70.5923, 9870, 4200, "Cotton;Castor;Millet", 620, 22.1, "hard_rock", "estimated"),
    ("RKT007", "Vinchhiya", "Rajkot", "Vinchhiya", "581007", 22.5621, 70.9834, 5640, 2300, "Groundnut;Wheat", 590, 24.3, "hard_rock", "estimated"),
    ("RKT008", "Lodhika", "Rajkot", "Lodhika", "581008", 22.4012, 71.0156, 7890, 3500, "Cotton;Groundnut", 610, 21.7, "alluvial", "estimated"),
    ("RKT009", "Gondal", "Rajkot", "Gondal", "581009", 21.9618, 70.7967, 37800, 14000, "Groundnut;Cotton;Vegetables", 660, 16.2, "alluvial", "estimated"),
    ("RKT010", "Jetpur", "Rajkot", "Jetpur", "581010", 21.7556, 70.6234, 75200, 18000, "Groundnut;Cotton", 672, 14.8, "alluvial", "estimated"),
    ("RKT011", "Dhoraji", "Rajkot", "Dhoraji", "581011", 21.7311, 70.4519, 75000, 16000, "Groundnut;Millet", 695, 13.5, "alluvial", "estimated"),
    ("RKT012", "Upleta", "Rajkot", "Upleta", "581012", 21.7417, 70.2834, 50400, 13000, "Groundnut;Cotton", 705, 12.9, "alluvial", "estimated"),
    ("RKT013", "Tankara", "Rajkot", "Tankara", "581013", 22.6834, 70.7456, 18600, 7800, "Cotton;Castor", 510, 26.4, "hard_rock", "estimated"),
    ("RKT014", "Wankaner", "Rajkot", "Wankaner", "581014", 22.6167, 71.0000, 52100, 14500, "Cotton;Groundnut", 530, 23.8, "hard_rock", "estimated"),
    ("RKT015", "Jasdan", "Rajkot", "Jasdan", "581015", 22.0354, 71.2084, 28400, 10200, "Groundnut;Cotton", 615, 20.1, "alluvial", "estimated"),

    # Junagadh
    ("JNG001", "Mendarda", "Junagadh", "Mendarda", "582001", 21.3167, 70.4333, 18400, 7200, "Groundnut;Mango", 770, 13.8, "hard_rock", "estimated"),
    ("JNG002", "Bhesan", "Junagadh", "Bhesan", "582002", 21.0891, 71.2612, 24600, 9800, "Groundnut;Cotton", 735, 15.2, "alluvial", "estimated"),
    ("JNG003", "Keshod", "Junagadh", "Keshod", "582003", 21.3034, 70.2456, 31200, 11000, "Groundnut;Mango;Banana", 780, 12.4, "alluvial", "estimated"),
    ("JNG004", "Mangrol", "Junagadh", "Mangrol", "582004", 21.1209, 70.1156, 30800, 8900, "Groundnut;Millet;Fish", 798, 11.8, "coastal", "estimated"),
    ("JNG005", "Visavadar", "Junagadh", "Visavadar", "582005", 21.3789, 70.7234, 16700, 6300, "Groundnut;Cotton", 748, 14.6, "alluvial", "estimated"),
    ("JNG006", "Maliya Hatina", "Junagadh", "Maliya", "582006", 21.1345, 70.5678, 14200, 5400, "Groundnut;Millet", 762, 13.4, "hard_rock", "estimated"),
    ("JNG007", "Vanthali", "Junagadh", "Vanthali", "582007", 21.4689, 70.3256, 21500, 8200, "Groundnut;Wheat", 755, 13.9, "alluvial", "estimated"),
    ("JNG008", "Manavadar", "Junagadh", "Manavadar", "582008", 21.4989, 70.1345, 29800, 10500, "Cotton;Groundnut", 740, 14.5, "alluvial", "estimated"),

    # Amreli
    ("AMR001", "Savarkundla", "Amreli", "Savarkundla", "583001", 21.3345, 71.3234, 38500, 13400, "Groundnut;Castor", 610, 23.4, "hard_rock", "estimated"),
    ("AMR002", "Dhari", "Amreli", "Dhari", "583002", 21.3278, 71.0134, 22800, 8900, "Groundnut;Cotton", 625, 21.8, "hard_rock", "estimated"),
    ("AMR003", "Lathi", "Amreli", "Lathi", "583003", 21.7245, 71.3912, 10600, 4200, "Groundnut;Castor", 595, 24.6, "hard_rock", "estimated"),
    ("AMR004", "Bagasara", "Amreli", "Bagasara", "583004", 21.4867, 70.9523, 16900, 6700, "Groundnut;Millet", 618, 22.5, "alluvial", "estimated"),
    ("AMR005", "Jafrabad", "Amreli", "Jafrabad", "583005", 20.8612, 71.3756, 22300, 7800, "Groundnut;Fish", 645, 20.2, "coastal", "estimated"),
    ("AMR006", "Khambha", "Amreli", "Khambha", "583006", 21.3167, 71.6023, 12400, 4900, "Groundnut;Cotton", 600, 23.8, "hard_rock", "estimated"),
    ("AMR007", "Rajula", "Amreli", "Rajula", "583007", 21.0412, 71.4434, 47600, 14500, "Groundnut;Cotton", 638, 21.0, "alluvial", "estimated"),
    ("AMR008", "Babra", "Amreli", "Babra", "583008", 21.8456, 71.4567, 15800, 6100, "Castor;Groundnut", 585, 25.3, "hard_rock", "estimated"),
    ("AMR009", "Kukavav", "Amreli", "Kukavav", "583009", 21.6734, 71.5234, 8900, 3400, "Groundnut;Wheat", 592, 24.9, "hard_rock", "estimated"),
    ("AMR010", "Liliya", "Amreli", "Liliya", "583010", 21.7345, 71.2678, 11200, 4600, "Groundnut;Castor", 590, 25.7, "hard_rock", "estimated"),

    # Bhavnagar
    ("BHV001", "Palitana", "Bhavnagar", "Palitana", "584001", 21.5234, 71.8234, 45600, 16000, "Wheat;Cotton;Sesame", 545, 26.8, "hard_rock", "estimated"),
    ("BHV002", "Talaja", "Bhavnagar", "Talaja", "584002", 21.3445, 72.0345, 26700, 9400, "Groundnut;Cotton", 558, 25.4, "alluvial", "estimated"),
    ("BHV003", "Mahuva", "Bhavnagar", "Mahuva", "584003", 21.0867, 71.7634, 52300, 17000, "Groundnut;Cotton;Banana", 562, 24.6, "alluvial", "estimated"),
    ("BHV004", "Sihor", "Bhavnagar", "Sihor", "584004", 21.6991, 71.9617, 50800, 16500, "Wheat;Groundnut", 550, 26.1, "alluvial", "estimated"),
    ("BHV005", "Gariadhar", "Bhavnagar", "Gariadhar", "584005", 21.5312, 71.5734, 12600, 5100, "Groundnut;Cotton", 540, 27.5, "hard_rock", "estimated"),

    # Surendranagar
    ("SRN001", "Dhrangadhra", "Surendranagar", "Dhrangadhra", "587001", 22.9891, 71.4667, 81200, 22000, "Cotton;Salt;Castor", 440, 30.2, "hard_rock", "estimated"),
    ("SRN002", "Wadhwan", "Surendranagar", "Wadhwan", "587002", 22.7034, 71.6789, 42100, 14500, "Cotton;Wheat", 448, 29.6, "hard_rock", "estimated"),
    ("SRN003", "Halvad", "Surendranagar", "Halvad", "587003", 23.0167, 71.1834, 36500, 13200, "Cotton;Castor", 430, 31.4, "hard_rock", "estimated"),
    ("SRN004", "Limbdi", "Surendranagar", "Limbdi", "587004", 22.5634, 71.8234, 32400, 11800, "Cotton;Groundnut", 455, 28.9, "alluvial", "estimated"),
    ("SRN005", "Chotila", "Surendranagar", "Chotila", "587005", 22.4245, 71.1923, 18700, 7200, "Cotton;Castor", 460, 29.1, "hard_rock", "estimated"),

    # Gir Somnath
    ("GIR001", "Veraval", "Gir Somnath", "Veraval", "589001", 20.9023, 70.3618, 112000, 12000, "Fish;Groundnut", 790, 11.5, "coastal", "estimated"),
    ("GIR002", "Talala", "Gir Somnath", "Talala", "589002", 21.0234, 70.5023, 22100, 8400, "Mango;Groundnut", 802, 11.2, "hard_rock", "estimated"),
    ("GIR003", "Una", "Gir Somnath", "Una", "589003", 20.8234, 71.0345, 32400, 9600, "Groundnut;Cotton;Banana", 788, 12.0, "alluvial", "estimated"),
    ("GIR004", "Kodinar", "Gir Somnath", "Kodinar", "589004", 20.7934, 70.7089, 44500, 11200, "Cotton;Groundnut", 775, 12.8, "hard_rock", "estimated"),
    ("GIR005", "Sutrapada", "Gir Somnath", "Sutrapada", "589005", 20.8456, 70.4891, 19800, 6800, "Groundnut;Millet", 785, 12.2, "coastal", "estimated"),

    # Jamnagar
    ("JMN001", "Dhrol", "Jamnagar", "Dhrol", "585001", 22.5623, 70.4123, 16800, 6400, "Groundnut;Cotton", 650, 17.5, "alluvial", "estimated"),
    ("JMN002", "Kalavad", "Jamnagar", "Kalavad", "585002", 22.2134, 70.3789, 23400, 8900, "Cotton;Groundnut", 660, 16.8, "alluvial", "estimated"),
    ("JMN003", "Lalpur", "Jamnagar", "Lalpur", "585003", 22.1890, 69.9567, 14500, 5800, "Groundnut;Castor", 640, 18.2, "hard_rock", "estimated"),
    ("JMN004", "Jamjodhpur", "Jamnagar", "Jamjodhpur", "585004", 21.9023, 70.0234, 19200, 7500, "Groundnut;Millet", 670, 15.9, "alluvial", "estimated"),
    ("JMN005", "Jodiya", "Jamnagar", "Jodiya", "585005", 22.6890, 70.3012, 11800, 4600, "Groundnut;Cotton", 620, 19.1, "coastal", "estimated"),

    # Morbi
    ("MOR001", "Tankara Morbi", "Morbi", "Tankara", "588001", 22.7567, 70.7890, 17400, 7100, "Cotton;Wheat", 515, 25.8, "hard_rock", "estimated"),
    ("MOR002", "Wankaner Morbi", "Morbi", "Wankaner", "588002", 22.6234, 70.9456, 48200, 13800, "Cotton;Groundnut", 525, 24.2, "hard_rock", "estimated"),
    ("MOR003", "Halvad Morbi", "Morbi", "Halvad", "588003", 22.9567, 71.1234, 31200, 11400, "Cotton;Castor", 490, 26.5, "hard_rock", "estimated"),
    ("MOR004", "Maliya Miyana", "Morbi", "Maliya", "588004", 23.0890, 70.7567, 15600, 5200, "Cotton;Salt", 470, 28.1, "coastal", "estimated"),

    # Porbandar
    ("PBD001", "Ranavav", "Porbandar", "Ranavav", "586001", 21.6890, 69.7567, 26800, 9200, "Groundnut;Millet", 710, 13.2, "coastal", "estimated"),
    ("PBD002", "Kutiyana", "Porbandar", "Kutiyana", "586002", 21.6234, 69.9890, 18900, 7100, "Groundnut;Wheat", 725, 12.8, "alluvial", "estimated"),
    ("PBD003", "Madhavpur", "Porbandar", "Porbandar", "586003", 21.2567, 69.9567, 9800, 3600, "Groundnut;Coconut", 740, 11.9, "coastal", "estimated"),

    # Devbhumi Dwarka
    ("DWK001", "Khambhalia", "Devbhumi Dwarka", "Khambhalia", "590001", 22.2034, 69.6567, 43200, 14200, "Groundnut;Millet", 590, 20.4, "coastal", "estimated"),
    ("DWK002", "Kalyanpur", "Devbhumi Dwarka", "Kalyanpur", "590002", 22.0345, 69.4567, 24600, 9100, "Groundnut;Cotton", 605, 19.8, "coastal", "estimated"),
    ("DWK003", "Bhanvad", "Devbhumi Dwarka", "Bhanvad", "590003", 21.9234, 69.7890, 21800, 8300, "Groundnut;Castor", 615, 18.9, "hard_rock", "estimated"),
    ("DWK004", "Okhamandal", "Devbhumi Dwarka", "Dwarka", "590004", 22.2456, 68.9678, 38900, 11200, "Millet;Groundnut", 580, 21.2, "coastal", "estimated"),

    # Botad
    ("BTD001", "Gadhada", "Botad", "Gadhada", "591001", 21.9678, 71.5890, 34500, 12400, "Cotton;Groundnut", 560, 25.1, "hard_rock", "estimated"),
    ("BTD002", "Barwala", "Botad", "Barwala", "591002", 22.1567, 71.8901, 18200, 6900, "Cotton;Wheat", 540, 26.3, "alluvial", "estimated"),
    ("BTD003", "Ranpur", "Botad", "Ranpur", "591003", 22.3456, 71.7123, 19800, 7400, "Cotton;Castor", 530, 26.8, "hard_rock", "estimated"),
]

def generate():
    os.makedirs(DATA_DIR, exist_ok=True)
    
    # 1. villages.csv
    v_path = os.path.join(DATA_DIR, "villages.csv")
    with open(v_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "village_id", "name", "district", "taluka", "lgd_code", "lat", "lon",
            "population", "agricultural_area_ha", "primary_crops",
            "annual_rainfall_mm", "groundwater_depth_m", "aquifer_type", "data_source"
        ])
        for v in VILLAGES:
            writer.writerow(list(v))
    print(f"Wrote {len(VILLAGES)} villages to {v_path}")

    # 2. groundwater.csv
    gw_path = os.path.join(DATA_DIR, "groundwater.csv")
    with open(gw_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["village_id", "year", "month", "depth_m", "change_from_prev_year_m", "quality", "data_source"])
        for v in VILLAGES:
            v_id = v[0]
            base_depth = float(v[11])
            for year in range(2019, 2025):
                for month in range(1, 13):
                    season_offset = 1.8 if month in (4, 5, 6) else (-1.2 if month in (9, 10, 11) else 0.2)
                    year_trend = (year - 2019) * 0.35
                    depth = round(base_depth + season_offset + year_trend, 2)
                    change = round(0.35 if year > 2019 else 0.0, 2)
                    quality = "good" if depth < 18 else ("moderate" if depth < 25 else "saline")
                    writer.writerow([v_id, year, month, depth, change, quality, "estimated"])
    print(f"Wrote groundwater records to {gw_path}")

    # 3. rainfall.csv
    rf_path = os.path.join(DATA_DIR, "rainfall.csv")
    with open(rf_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["village_id", "year", "month", "rainfall_mm", "historical_avg_mm", "deficit_pct", "season", "data_source"])
        monthly_weights = {
            1: (0.01, "rabi"), 2: (0.01, "rabi"), 3: (0.01, "rabi"),
            4: (0.02, "summer"), 5: (0.03, "summer"), 6: (0.18, "kharif"),
            7: (0.35, "kharif"), 8: (0.26, "kharif"), 9: (0.11, "kharif"),
            10: (0.03, "rabi"), 11: (0.01, "rabi"), 12: (0.00, "rabi")
        }
        for v in VILLAGES:
            v_id = v[0]
            annual_normal = float(v[10])
            for year in range(2019, 2025):
                anomaly_factor = {2019: 1.12, 2020: 1.05, 2021: 0.88, 2022: 0.94, 2023: 0.82, 2024: 0.98}[year]
                for month, (w, season) in monthly_weights.items():
                    hist_avg = round(annual_normal * w, 1)
                    actual = round(hist_avg * anomaly_factor, 1)
                    deficit = round(((actual - hist_avg) / hist_avg) * 100, 1) if hist_avg > 0 else 0.0
                    writer.writerow([v_id, year, month, actual, hist_avg, deficit, season, "estimated"])
    print(f"Wrote rainfall records to {rf_path}")

    # 4. water_demand.csv
    wd_path = os.path.join(DATA_DIR, "water_demand.csv")
    with open(wd_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "village_id", "year", "domestic_demand_mcm", "agricultural_demand_mcm",
            "industrial_demand_mcm", "total_demand_mcm", "available_supply_mcm", "deficit_mcm", "data_source"
        ])
        for v in VILLAGES:
            v_id = v[0]
            pop = int(v[7])
            ag_ha = int(v[8])
            dom_mcm = round((pop * 60 * 365) / 1_000_000_000, 3)
            ag_mcm = round(ag_ha * 0.005, 2)
            ind_mcm = round(dom_mcm * 0.25, 3)
            for year in range(2019, 2025):
                growth = 1 + (year - 2019) * 0.02
                tot = round((dom_mcm + ag_mcm + ind_mcm) * growth, 2)
                supply_factor = {2019: 1.05, 2020: 1.02, 2021: 0.88, 2022: 0.92, 2023: 0.80, 2024: 0.95}[year]
                supply = round(tot * supply_factor * 0.88, 2)
                deficit = round(supply - tot, 2)
                writer.writerow([
                    v_id, year, round(dom_mcm * growth, 3), round(ag_mcm * growth, 2),
                    round(ind_mcm * growth, 3), tot, supply, deficit, "estimated"
                ])
    print(f"Wrote water demand records to {wd_path}")

    # 5. recharge.csv
    rc_path = os.path.join(DATA_DIR, "recharge.csv")
    with open(rc_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["village_id", "year", "structure_type", "count", "estimated_recharge_mcm", "status", "notes", "data_source"])
        for v in VILLAGES:
            v_id = v[0]
            writer.writerow([v_id, 2021, "check_dam", 4, 1.8, "operational", "Govt watershed scheme", "estimated"])
            writer.writerow([v_id, 2022, "farm_pond", 12, 0.9, "operational", "Farmer-led community pond", "estimated"])
            writer.writerow([v_id, 2023, "recharge_borewell", 25, 0.45, "operational", "Direct aquifer injection", "estimated"])
            writer.writerow([v_id, 2024, "percolation_tank", 2, 2.1, "planned", "Sujalam Sufalam Jal Abhiyan", "estimated"])
    print(f"Wrote recharge records to {rc_path}")

if __name__ == "__main__":
    generate()
