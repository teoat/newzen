
import csv
import re

def parse_val(value):
    if not value:
        return None
    clean = value.replace('Rp', '').replace(' ', '').replace('.', '').replace(',', '.')
    try:
        return float(clean)
    except Exception:
        return None

def parse_euro(value):
    # Parse 1.000,00 -> 1000.00
    if not value:
        return 0.0
    clean = value.replace('Rp', '').replace(' ', '').replace('.', '').replace(',', '.')
    try:
        return float(clean)
    except Exception:
        return 0.0
        
def parse_euro_qty(value):
    # Parse 1.000,00 -> 1000.00
    if not value:
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
                # --- EXTRACT CONTRACT DATA RELATIVE TO UNIT ---
                # Finding unit specifically at index 4 is risky if cols shift.
                # Let's find index of unit string i row.
                # Caution: 'Ls' might appear in description
                # Search after index 2
                
                unit_idx = -1
                if unit:
                    try:
                        # Find unit after description column
                        for idx in range(2, len(row)):
                            if row[idx].strip() == unit:
                                unit_idx = idx
                                break
                    except Exception:
                        pass
                
                if unit_idx == -1:
                    unit_idx = 4  # Fallback
                
                # Verify neighbors look numeric
                # u+1: Qty
                # u+2: Price
                # u+3: Total
                
                orig_qty = parse_euro_qty(row[unit_idx+1])
                orig_price = parse_euro(row[unit_idx+2])
                orig_total = parse_euro(row[unit_idx+3])
                orig_wght = parse_euro(row[unit_idx+4])

                if is_vat:

                    orig_qty = 1.0

                # --- EXTRACT CCO (FINAL) DATA VIA NON_EMPTY HEURISTIC ---
                # CCO is always at the end of the non-empty chain
                cco_block = non_empty[-4:]
                
                # Check for misalignment where Weight is last
                cco_qty = parse_euro_qty(cco_block[0])
                cco_price = parse_euro(cco_block[1])
                cco_total = parse_euro(cco_block[2])
                cco_wght = parse_euro(cco_block[3])

                if is_vat:

                    cco_qty = 1.0

                if cco_total == 0 and orig_total == 0:

                    continue
                
                items.append({
                    'item_code': item_code,
                    'description': description,
                    'unit': unit,
                    
                    'qty_contract': orig_qty,
                    'unit_price_contract': orig_price,
                    'total_contract': orig_total,
                    'weight_contract_pct': orig_wght,
                    
                    'qty_cco': cco_qty,
                    'unit_price_cco': cco_price,
                    'total_cco': cco_total,
                    'weight_cco_pct': cco_wght,
                    
                    'qty_diff': cco_qty - orig_qty,
                    'total_diff': cco_total - orig_total
                })

            except Exception:
                # print(f"Error {item_code}: {e}")
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
