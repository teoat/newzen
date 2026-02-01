
import csv
import re

def parse_currency(value):
    if not value or value.strip() == '-' or value.strip() == '':
        return 0.0
    # Clean up currency string
    clean = value.replace('Rp', '').replace(' ', '').replace('.', '').replace(',', '.')
    try:
        return float(clean)
    except Exception:
        return 0.0

def parse_qty(value):
    if not value or value.strip() == '-' or value.strip() == '':
        return 0.0
    clean = value.replace(' ', '').replace('.', '').replace(',', '.')
    # Note: Quantity in this file format (Indonesian) uses comma for decimal usually?
    # Let's check typical value "1.00" -> 1,00
    # Ideally we replace . with nothing and , with .
    # But wait, currency had "195.175.000,00" -> 195175000.00
    # Quantity "1,00" -> 1.00
    
    clean = value.replace('.', '') # Remove thousand separators if any
    clean = clean.replace(',', '.') # Convert decimal comma to dot
    try:
        return float(clean)
    except Exception:
        return 0.0

def is_valid_item_code(code):
    if not code:
        return False
    # Allow 1.2, 7.1.(5a), 3.1.(1a), 1,19
    if len(code) > 15:
        return False 
    if re.match(r'^[A-Z]$', code):
        return False 
    if 'DIV' in code.upper():
        return False
    if 'JUMLAH' in code.upper():
        return False
    
    # Must contain digit and dot/comma
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
            
            non_empty = [c.strip() for c in row if c.strip()]
            if len(non_empty) < 5:
                continue 
            
            item_code = row[0].strip()
            description = row[1].strip()
            unit = row[4].strip()

            # Special exception: Allow VAT/PPN row
            is_vat = 'PPN' in description.upper() or 'PAJAK' in description.upper()

            if not is_valid_item_code(item_code) and not is_vat:

                continue
                
            try:
                # --- EXTRACT CCO (FINAL) DATA ---
                # Based on previous analysis: Last valid non-empty block of 4 is [Qty, Price, Total, Weight]
                # row[-5] to row[-2] relative to END of row usually works?
                # Actually, let's use the non_empty list logic which is safer against empty tail cells
                
                # CCO Data (Final) - Last 4 values
                cco_vals = non_empty[-4:] 
                cco_qty = parse_qty(cco_vals[0])
                if is_vat:
                    cco_qty = 1.0
                cco_price = parse_currency(cco_vals[1])
                cco_total = parse_currency(cco_vals[2])
                cco_weight = parse_currency(cco_vals[3])

                # --- EXTRACT CONTRACT (ORIGINAL) DATA ---
                # Contract data is usually at fixed indices 5, 6, 7, 8 in the raw row
                # Col 5: Qty
                # Col 6: Price
                # Col 7: Total
                # Col 8: Weight
                
                orig_qty = parse_qty(row[5])
                if is_vat:
                    orig_qty = 1.0
                orig_price = parse_currency(row[6])
                orig_total = parse_currency(row[7])
                orig_weight = parse_currency(row[8])

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
                    
                    'qty_change': cco_qty - orig_qty,
                    'total_change': cco_total - orig_total
                })
            except Exception:
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
                
                f"{item['qty_change']:.2f}",
                f"{item['total_change']:.2f}"
            ])

input_file = '/Users/Arief/Library/Mobile Documents/com~apple~CloudDocs/Aldi/data cco aldi/00003792-CCO WAI IPE SAIYA JUSTEK/CCO 01-Table 1.csv'
output_file = '/Users/Arief/Newzen/zenith-lite/detailed_rab_data.csv'
generate_detailed_rab(input_file, output_file)
