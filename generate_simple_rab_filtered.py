
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

def is_valid_item_code(code):
    # Valid codes: 1.2, 7.1.(5a), 3.1.(1a), 1,19
    # Invalid codes: DIV.I, Jumlah, A, B, C, D
    if not code:
        return False
    if len(code) > 10:
        return False # Code shouldn't be long
    if re.match(r'^[A-Z]$', code):
        return False # Single letters A, B, C are summaries
    if 'DIV' in code.upper():
        return False
    if 'JUMLAH' in code.upper():
        return False
    
    # Must contain at least one digit and a dot or comma
    # Examples: "1.2", "7.6.(12b)", "1,21"
    if not re.search(r'\d', code):
        return False
    if not ('.' in code or ',' in code):
        return False
    
    return True

def generate_simple_rab_filtered(input_path, output_path):
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

            # Special exception: Allow VAT/PPN row even if code is "B"
            is_vat = 'PPN' in description.upper() or 'PAJAK' in description.upper()

            if not is_valid_item_code(item_code) and not is_vat: 
                # print(f"Skipping summary/invalid row: {item_code}")
                continue
                
            try:
                # Based on previous analysis:
                # Last valid non-empty block of 4 is [Qty, Price, Total, Weight]
                last_vals = non_empty[-4:] 
                
                cco_qty = parse_currency(last_vals[0])
                if is_vat:
                    cco_qty = 1.0 # VAT usually has no qty, treat as lump sum 1.0
                
                cco_price = parse_currency(last_vals[1])
                cco_total = parse_currency(last_vals[2])
                
                if cco_qty == 0 and cco_total == 0:
                
                    continue
                
                items.append({
                    'item_code': item_code,
                    'description': description,
                    'unit': unit,
                    'qty_rab': cco_qty,
                    'unit_price_rab': cco_price,
                    'total_rab': cco_total
                })
            except Exception:
                pass

    # Verify Total
    total_val = sum(i['total_rab'] for i in items)
    print(f"Calculated Total from {len(items)} items: {total_val:,.2f}")
    
    print(f'writing {len(items)} items to {output_path}...')
    
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['item_code', 'description', 'unit', 'qty_rab', 'unit_price_rab', 'total_rab'])
        
        for item in items:
            writer.writerow([
                item['item_code'],
                item['description'],
                item['unit'],
                f"{item['qty_rab']:.2f}",
                f"{item['unit_price_rab']:.2f}",
                f"{item['total_rab']:.2f}"
            ])

input_file = '/Users/Arief/Library/Mobile Documents/com~apple~CloudDocs/Aldi/data cco aldi/00003792-CCO WAI IPE SAIYA JUSTEK/CCO 01-Table 1.csv'
output_file = '/Users/Arief/Newzen/zenith-lite/simplified_rab_data.csv'
generate_simple_rab_filtered(input_file, output_file)
