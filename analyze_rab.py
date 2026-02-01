
import csv

def parse_currency(value):
    if not value or value.strip() == "-" or value.strip() == "":
        return 0.0
    clean = value.replace(".", "").replace(",", ".")
    try:
        return float(clean)
    except Exception:
        return 0.0

def analyze_cco(file_path):
    print(f"Analyzing {file_path}...")
    changes = []

    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter=";")
        rows = list(reader)

        for i, row in enumerate(rows):
            if i < 12:
                continue
            if len(row) < 10:
                continue

            item_code = row[0].strip()
            description = row[1].strip()

            if not item_code or not description:

                continue
            if "DIV" in item_code or "JUMLAH" in description:
                continue

            try:
                # Corrected Indices
                # Original Total = 8
                # CCO Total = -4 (assuming 2 empty slots at end)
                
                orig_total = parse_currency(row[8]) 
                cco_total = parse_currency(row[-4])
                
                # Double check parsing on first item
                if i == 13: # Just pick an early row to debug print
                    print(f"DEBUG ROW {i}: {item_code}")
                    print(f"Orig Raw (8): {row[8]} -> {orig_total}")
                    print(f"CCO Raw (-4): {row[-4]} -> {cco_total}")
                
                diff = cco_total - orig_total
                
                # Include ALL differences to see the sum, even small ones
                if abs(diff) > 1.0:
                    changes.append({
                        'item_code': item_code,
                        'desc': description,
                        'orig_total': orig_total,
                        'cco_total': cco_total,
                        'diff': diff
                    })
            except Exception:
                pass

    changes.sort(key=lambda x: abs(x['diff']), reverse=True)
    
    print(f'Found {len(changes)} items with significant changes.')
    print(f"{'ITEM':<15} | {'DESCRIPTION':<50} | {'ORIGINAL (Rp)':>20} | {'CCO (Rp)':>20} | {'DIFFERENCE (Rp)':>20}")
    print('-' * 140)
    
    total_change = 0
    total_orig = 0
    total_cco = 0
    
    for c in changes:
        print(f"{c['item_code']:<15} | {c['desc'][:50]:<50} | {c['orig_total']:20,.2f} | {c['cco_total']:20,.2f} | {c['diff']:20,.2f}")
        total_change += c['diff']
        total_orig += c['orig_total']
        total_cco += c['cco_total']
        
    print('-' * 140)
    print(f"{'NET CHANGE':<68} | {total_orig:20,.2f} | {total_cco:20,.2f} | {total_change:20,.2f}")

file_path = '/Users/Arief/Library/Mobile Documents/com~apple~CloudDocs/Aldi/data cco aldi/00003792-CCO WAI IPE SAIYA JUSTEK/CCO 01-Table 1.csv'
analyze_cco(file_path)
