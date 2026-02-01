
import csv
import re

def parse_val(value):
    if not value:
        return None
    # Check if looks numeric structure: digits, dots, commas
    # exclude "1.8.(1)" or "Ls"
    if re.search(r'[a-zA-Z]', value.replace('Rp', '').replace(' ', '')):
        return None # Has chars -> Not number
    if regex_is_code(value):
        return None # Is a code like 1.2
    
    # Try parsing
    clean = value.replace('Rp', '').replace(' ', '').replace('.', '').replace(',', '.')
    try:
        return float(clean)
    except Exception:
        return None

def regex_is_code(val):
    # Check if 1.2.3 format
    return bool(re.match(r'^[\d\.\(\)a-z]+$', val)) and ('(' in val or val.count('.') >= 1)

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

            # Pass-through valid rows
            if not is_vat and (not item_code or 'DIV' in item_code or 'JUMLAH' in description):
                continue

            # Identify Numeric Columns
            # We want to find the chunks of numbers.
            # Contract Block = First 4 numbers
            # CCO Block = Last 4 numbers
            
            numeric_vals = []
            
            # Scan non_empty skip first 2 (Code, Desc)
            for val in non_empty:
                # If val is code or desc or unit, skip
                if val == item_code or val == description or val == unit:
                    continue
                
                parsed = parse_val(val)
                if parsed is not None:
                    numeric_vals.append(val)
            
            if len(numeric_vals) < 8: 
                # Maybe only CCO changes? Or incomplete row?
                # If only 4 nums, assume they are CCO and Contract was 0? No, unsafe.
                # Let's rely on fixed offsets if heuristic fails
                # Contract Qty is usually 4th non-empty (Code, Desc, Unit, Qty)
                pass

            try:
                # Fallback to smart indexing based on column density
                # Contract Qty = Index 5 in raw row
                # Contract Price = Index 6
                # Contract Total = Index 7
                # Contract Weight = Index 8
                
                orig_qty = parse_euro_qty(row[5])
                orig_price = parse_euro(row[6])
                orig_total = parse_euro(row[7])
                orig_wght = parse_euro(row[8])
                
                if is_vat:
                
                    orig_qty = 1.0

                # CCO is at end
                # CCO Qty = -5?
                # CCO Price = -4?
                # CCO Total = -3?
                # CCO Weight = -2?
                # (Assuming last column is empty string)
                
                # Let's grab last 4 non-empty from `non_empty` list for CCO
                cco_block = non_empty[-4:]
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
