
import csv
import re

def parse_currency(value):
    if not value or value.strip() == '-' or value.strip() == '':
        return 0.0
    clean = value.replace('Rp', '').replace(' ', '').replace('.', '').replace(',', '.')
    try:
        return float(clean)
    except Exception:
        return 0.0

def parse_qty(value):
    if not value or value.strip() == '-' or value.strip() == '':
        return 0.0
    clean = value.replace(' ', '').replace('.', '').replace(',', '.')
    try:
        return float(clean)
    except Exception:
        return 0.0

def is_valid_item_code(code):
    if not code:
        return False
    if len(code) > 15:
        return False 
    if re.match(r'^[A-Z]$', code):
        return False 
    if 'DIV' in code.upper():
        return False
    if 'JUMLAH' in code.upper():
        return False
    if not re.search(r'\d', code):
        return False
    if not ('.' in code or ',' in code):
        return False
    return True

def generate_detailed_rab(input_path, output_path):
    print(f'Processing {input_path}...')
    items = []
    
    with open(input_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter=';')
        rows = list(reader)
        
        for i, row in enumerate(rows):
            if i < 12:
                continue
            
            # Use non-empty mapping to be safer
            # Expected: [Code, Desc, ..., Unit, Qty1, Price1, Total1, ..., values ..., Qty2, Price2, Total2, Wght2]
            non_empty = [c.strip() for c in row if c.strip()]
            
            if len(non_empty) < 8:
            
                continue 
            
            item_code = row[0].strip()
            description = row[1].strip()
            unit = row[4].strip()

            is_vat = 'PPN' in description.upper() or 'PAJAK' in description.upper()

            if not is_valid_item_code(item_code) and not is_vat:

                continue
                
            try:
                # --- EXTRACT CCO (FINAL) DATA ---
                # Safe: Last 4 non-empty values
                cco_vals = non_empty[-4:] 
                cco_qty = parse_qty(cco_vals[0])
                if is_vat:
                    cco_qty = 1.0
                cco_price = parse_currency(cco_vals[1])
                cco_total = parse_currency(cco_vals[2])
                cco_weight = parse_currency(cco_vals[3])

                # --- EXTRACT CONTRACT (ORIGINAL) DATA ---
                # Search for Unit in non_empty list to find anchor
                try:
                    unit_idx = non_empty.index(unit)
                    # Contract data follows unit: [Qty, Price, Total, Weight]
                    contract_vals = non_empty[unit_idx+1 : unit_idx+5]
                    
                    orig_qty = parse_qty(contract_vals[0])
                    if is_vat:
                        orig_qty = 1.0
                    orig_price = parse_currency(contract_vals[1])
                    orig_total = parse_currency(contract_vals[2])
                    orig_weight = parse_currency(contract_vals[3])
                except ValueError:
                    # If unit not found in non_empty (e.g. if unit was empty string)
                    # Fallback to fixed offset relative to start?
                    # Or relative to non_empty start?
                    # usually [Code, Desc, Unit, Qty, ...] -> Index 3,4,5,6
                   
                    # Let's try skipping code & desc
                     contract_vals = non_empty[2:6] # Assuming Code, Desc are first 2
                     orig_qty = parse_qty(contract_vals[0])
                     orig_price = parse_currency(contract_vals[1])
                     orig_total = parse_currency(contract_vals[2])
                     orig_weight = parse_currency(contract_vals[3])

                if cco_total == 0 and orig_total == 0:

                    continue
                
                items.append({
                    'item_code': item_code,
                    'description': description,
                    'unit': unit,
                    
                    'qty_contract': orig_qty,
                    'unit_price_contract': orig_price,
                    'total_contract': orig_total,
                    'weight_contract_pct': orig_weight,
                    
                    'qty_cco': cco_qty,
                    'unit_price_cco': cco_price,
                    'total_cco': cco_total,
                    'weight_cco_pct': cco_weight,
                    
                    'qty_diff': cco_qty - orig_qty,
                    'total_diff': cco_total - orig_total
                })
            except Exception:
                # print(f"Error row {i}: {e}")
                pass

    print(f'writing {len(items)} items to {output_path}...')
    
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        header = [
            'item_code', 'description', 'unit',
            'qty_contract', 'unit_price_contract', 'total_contract', 'weight_contract_pct',
            'qty_cco', 'unit_price_cco', 'total_cco', 'weight_cco_pct',
            'qty_diff', 'total_diff'
        ]
        writer.writerow(header)
        
        for item in items:
            writer.writerow([
                item['item_code'],
                item['description'],
                item['unit'],
                f"{item['qty_contract']:.2f}",
                f"{item['unit_price_contract']:.2f}",
                f"{item['total_contract']:.2f}",
                f"{item['weight_contract_pct']:.4f}",
                
                f"{item['qty_cco']:.2f}",
                f"{item['unit_price_cco']:.2f}",
                f"{item['total_cco']:.2f}",
                f"{item['weight_cco_pct']:.4f}",
                
                f"{item['qty_diff']:.2f}",
                f"{item['total_diff']:.2f}"
            ])

input_file = '/Users/Arief/Library/Mobile Documents/com~apple~CloudDocs/Aldi/data cco aldi/00003792-CCO WAI IPE SAIYA JUSTEK/CCO 01-Table 1.csv'
output_file = '/Users/Arief/Newzen/zenith-lite/detailed_rab_data.csv'
generate_detailed_rab(input_file, output_file)
